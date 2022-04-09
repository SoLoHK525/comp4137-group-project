import { SHA256 } from 'crypto-js';
import { BlockService } from 'src/block/block.service';
import { TxOut } from 'src/transaction/transaction.interface';

export class Mint {
    id: string;
    txIn: number; //input of coinbase transaction is the block height
    txOut: TxOut;

    constructor(txIn: number, txOut: TxOut) {
        this.id = this.setCoinbaseTxID();
        this.txIn = txIn;
        this.txOut = txOut;
    }

    public static coinbaseTx(address: string, award: number, blockService: BlockService): Mint {
        const txIn = blockService.getBlockHeight();
        const txOut = new TxOut(address, award);
        const coinbaseTx = new Mint(txIn, txOut);
        return coinbaseTx;
    }

    setCoinbaseTxID(): string {
        const txInContent: number = this.txIn;

        const txOutContent: string = this.txOut.address + this.txOut.amount;

        return SHA256(SHA256(txInContent + txOutContent)).toString();
    }
}
