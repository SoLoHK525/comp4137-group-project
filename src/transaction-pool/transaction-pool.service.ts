import { Injectable, Logger } from '@nestjs/common';
import { FileService } from "../file/file.service";
import { RegularTx, Transaction } from "../transaction/transaction.interface";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class TransactionPoolService {
    private readonly path = 'transaction';
    private readonly transactionPoolFilePath = `${this.path}/pool.json`;
    private readonly logger = new Logger(TransactionPoolService.name);
    private transactions: RegularTx[];

    constructor(private readonly fileService: FileService) {
    }

    private async onApplicationBootstrap() {
        if (this.fileService.exists(this.transactionPoolFilePath)) {
            this.transactions = await this.load();
        } else {
            this.logger.verbose('Block manifest not found, creating manifest');
            this.transactions = [];
            await this.save();
        }
    }

    public async pollTransactions(limit = 20) {
        const transactions = this.transactions.slice(0, limit);
        await this.save();
        return transactions;
    }

    public async removeTransactions(txs: Transaction[]) {
        this.transactions = this.transactions.filter(transactionInPool => {
            return txs.findIndex(tx => tx.id === transactionInPool.id) === -1;
        });

        await this.save();
    }

    public async addTransaction(tx: RegularTx) {
        const existTx = this.hasTransaction(tx);

        if (!existTx) {
            this.logger.verbose("Added transaction " + tx.id);
            this.transactions.push(tx);
            await this.save();
            return true;
        }else{
            return false;
        }
    }

    @OnEvent('broadcast.transaction')
    async receiveTransaction(transaction: RegularTx) {
        if(await this.addTransaction(transaction)){
            this.logger.debug("Received and added transaction: " + transaction.id);
        }else{
            this.logger.debug("Transaction already exists");
        }
    }

    public hasTransaction(tx: RegularTx) {
        const bool = this.transactions.findIndex(t => t.id === tx.id) !== -1;
        return bool;
    }

    private async save() {
        this.logger.verbose("Saving transactions");
        await this.fileService.save(this.transactionPoolFilePath, JSON.stringify({
            transactions: this.transactions
        }));
        return true;
    }

    private async load(): Promise<RegularTx[]> {
        const file = await this.fileService.load(this.transactionPoolFilePath);
        const transactions: RegularTx[] = JSON.parse(file.toString()).transactions;

        return transactions.map(tx => {
            return new RegularTx(tx.txIns, tx.txOuts);
        });
    }
}
