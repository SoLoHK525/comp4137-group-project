import { SHA256 } from 'crypto-js';

var EC = require('elliptic').ec;
var ec = new EC('secp256k1');

export class Transaction {
    id: string;
    txIns: TxIn[];
    txOuts: TxOut[];

    constructor(addrs: string[], amount, txIns: TxIn[]){
        this.txIns = txIns;
        this.getTxOuts(addrs, amount);
        this.getId();
    }

    getTxOuts(addrs: string[], amount){
        addrs.forEach(addr => {
          this.txOuts.push(new TxOut(addr, amount));
        });
    
    }

    getId(): string {
        const txInContent: string = this.txIns
        .map ((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex)
        .reduce((a,b) => a + b, '');

        const txOutContent: string = this.txOuts
        .map((txOuts: TxOut) => txOuts.address + txOuts.amount)
        .reduce((a,b) => a + b, '');

        return SHA256(SHA256(txInContent + txOutContent)).toString();
    }
}

export class TxIn{
    txOutId: string; 
    txOutIndex: number;
    signature: string; 

    constructor(txOutId: string, txOutIndex: number, priKey){
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.signature = this.createSig(priKey, this.msgHash());
    }

    createSig(priKey: string, msg: string): string{
        return signature.sign(priKey, msg);
    }

    msgHash(): string{
        return SHA256(SHA256(this.txOutId + this.txOutIndex)).toString();
    }
}

export class TxOut{
    address: string; //public key
    amount: number;

    constructor(address: string, amount: number){
        this.address = address;
        this.amount = amount;
    }
}

export class signature{
    static sign(priKey: string, msg: string): string {
        const key = ec.keyFromPrivate(priKey, 'hex');
        const signature = key.sign(msg).toDER();
        return signature;
    }

    static verify(pubKey: string, sig: string, msg: string): void{
        const key = ec.keyFromPublic(pubKey, 'hex');
        return key.verify(msg, sig);
    }
}
