import { Injectable, Logger } from '@nestjs/common';
import { BlockService } from '../block/block.service';
import { RegularTx, RegularTxIn, Signature, Transaction, TxIn, TxOut, UTXO } from './transaction.interface';
import { OnEvent } from '@nestjs/event-emitter';
import { BroadcastService } from 'src/broadcast/broadcast.service';

@Injectable()
export class TransactionService {
    private readonly logger = new Logger(TransactionService.name);

    constructor(
        private readonly blockService: BlockService,
        private readonly broadcastService: BroadcastService
    ) {}

    onApplicationBootstrap() {
        // When the application starts
    }

    public async createTx (
        senderPubKey: string,
        senderPriKey: string,
        receiverPubKey: string,
        receiveAmount: number,
        fee: number,
    ) {
        const utxos = await this.getUXTO(senderPubKey);
        let sumUTXO = 0;

        const txIns = utxos.map((tx) => {
            sumUTXO += tx.txOut.amount;
            return new RegularTxIn(tx.txId, tx.txIndex, senderPriKey);
        });

        const txOuts = [];

        const totalAmountToSpend = receiveAmount + fee;

        if (sumUTXO < totalAmountToSpend) {
            // Not enough money
            throw new Error('Insufficient Balance'); //exception
        }

        for (let i = 0; i < txIns.length; i++) {
            // verify the input by signature
            // TODO: check if utxos[i].txOut.address is correct or not
            const checker = Signature.verify(utxos[i].txOut.address, txIns[i].signature, txIns[i].msgHash());

            if (!checker) {
                throw new Error('Invalid txIns'); //exception
            }
        }

        //Create out put to receiver by PP2K
        txOuts.push(new TxOut(receiverPubKey, receiveAmount));
        //return change to the sender
        const change = sumUTXO - receiveAmount - fee;
        txOuts.push(new TxOut(senderPubKey, change));

        const tx = new Transaction(txIns, txOuts);
        tx.setId();

        this.broadcast(tx);
        return tx;
    }

    public async getAllUTXO(): Promise<UTXO[]> {
        const outs = <UTXO[]>[];
        // loop all the blocks
        for (let i = 0; i < this.blockService.getBlockHeight(); i++) {
            const currentBlockHash = this.blockService.getBlockHash(i);
            const currentBlock = await this.blockService.getBlock(currentBlockHash);
            const currentTx = currentBlock.data.transactions; // need to convert to list of Transaction

            // loop all the transaction
            currentTx.forEach((currentTx) => {
                const txID = currentTx.id;
                const txOuts = currentTx.txOuts;
                const txIns = currentTx.txIns;

                // Create UTXO object for each TxOutPut, push to UTXO
                txOuts.forEach((txOut, i) => {
                    outs.push(new UTXO(txID, txOut, i)); // create UTXO obj that store tx, txid and index
                });

                // Remove the spent money
                txIns.forEach((tx) => {
                    if(tx instanceof RegularTxIn) {
                        const outID = tx.txOutId;
                        const outIndex = tx.txOutIndex;
                        const indexOfTx = outs.findIndex((obj) => {
                            return obj.txId == outID && obj.txIndex == outIndex;
                        });

                        if(indexOfTx >= 0) {
                            outs.splice(indexOfTx, 1);
                        }
                    }
                });
            });
        }
        return outs;
    }

    public async getUXTO(pubKey: string): Promise<UTXO[]> {
        const allUtxo = await this.getAllUTXO();

        return allUtxo.filter((tx) => {
            return tx.txOut.address === pubKey;
        });
    }

    broadcast(transaction: Transaction): boolean {
        this.broadcastService.broadcastEvent('transaction', transaction);
        return true;
    }

    @OnEvent('broadcast.transaction')
    receiveTransaction(transaction: Transaction) {
        //add all utxo to the utxo pool
    }
}
