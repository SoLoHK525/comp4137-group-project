import { SHA256 } from 'crypto-js';
import {BlockService} from '../block/block.service'

var EC = require('elliptic').ec;
var ec = new EC('secp256k1');

export class Transaction {
    id: string;
    txIns: TxIn[];
    txOuts: TxOut[];

    // constructor(addrs: string[], amount, txIns: TxIn[]){
    //     this.txIns = txIns;
    //     this.getTxOuts(addrs, amount);
    //     this.getId();
    // }

    // getTxOuts(addrs: string[], amount){
    //     addrs.forEach(addr => {
    //       this.txOuts.push(new TxOut(addr, amount));
    //     });
    
    // }

    constructor(ins: Array<TxIn>, outs: Array<TxOut>){
        this.id = this.setId();
        this.txIns = ins;
        this.txOuts = outs;
    }

    setId(): string {
        const txInContent: string = this.txIns
        .map ((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex)
        .reduce((a,b) => a + b, '');

        const txOutContent: string = this.txOuts
        .map((txOuts: TxOut) => txOuts.address + txOuts.amount)
        .reduce((a,b) => a + b, '');

        return SHA256(SHA256(txInContent + txOutContent)).toString();
    }

    // public static coinbaseTx(address: string, info: string): Transaction{
    //     //address is the pubkey, info: any dummy string
    //     const award = 50
    //     const txIn = new TxIn('', -1,info)
    //     const txOut = new TxOut(address, award)
    //     const tx = new Transaction([txIn],[txOut])
    //     return tx
    // }

    public static createTx(senderPubKey:string, senderPriKey:string, receiverPubKey:string, receiveAmount:number, fee:number){
        const utxos = this.findUTXO(senderPubKey)
        let sumUTXO = 0
        const txIns = []
        const txOuts = []
        utxos.forEach((utxo)=>{
            //the sum of UTXO of a pubkey
            sumUTXO+=utxo.txOut.amount
            // Create input object for each UTXO, sign the input by user private key
            txIns.push(new TxIn(utxo.txId, utxo.txIndex, senderPriKey))
        })
        const totalAmountToSpend = receiveAmount+fee
        if(sumUTXO < totalAmountToSpend){
            // Not enough money
            return //exception
        }
        for(let i=0;i<txIns.length;i++){
            // verify the input by signature
            const checker = signature.verify(utxos[i].address, txIns[i].signature, txIns[i].msgHash())
            if(!checker){
                return //exception 
            }
        }
        //Create out put to receiver by PP2K
        txOuts.push(new TxOut(receiverPubKey, receiveAmount))
        //return change to the sender
        const change = sumUTXO - receiveAmount - fee
        txOuts.push(new TxOut(senderPubKey, change))

        const tx = new Transaction(txIns,txOuts)
        // tx.setId()
        return tx
    }

    public static findUTXO(sendPubKey: string){
        // TODO
        return []
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

export class UTXO{
    txId: string;
    txOut: TxOut;
    txIndex: number;

    constructor(txId:string, txOut:TxOut, txIndex:number) {
        this.txId = txId;
        this.txOut = txOut;
        this.txIndex = txIndex;
    }
}

export class signature{
    static sign(priKey: string, msg: string): string {
        const key = ec.keyFromPrivate(priKey, 'hex');
        const signature = key.sign(msg).toDER();
        return signature;
    }

    static verify(pubKey: string, sig: string, msg: string): boolean{
        const key = ec.keyFromPublic(pubKey, 'hex');
        return key.verify(msg, sig);
    }
}
