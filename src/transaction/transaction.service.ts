import { Injectable, Logger } from '@nestjs/common';
import { BlockService } from '../block/block.service';
import { signature, Transaction, TxIn, TxOut } from '../transaction/transaction.interface';
import { SHA256 } from 'crypto-js';

@Injectable()
export class TransactionService {
    private readonly logger = new Logger(TransactionService.name);

    constructor(private readonly blockService: BlockService) {}

    onApplicationBootstrap() {
        // When the application starts
    }

    makeTransaction(addrs: string[], amount: number): boolean {
        return false;
    }

    broadcast(transaction: Transaction): boolean {
        //network level -> broadcasting transaction to all nodes
        return false;
    }
}
