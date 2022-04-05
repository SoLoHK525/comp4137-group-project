import { SHA256 } from 'crypto-js';

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

    public static coinbaseTx(address: string, info: string): Transaction{
        //address is the pubkey, info: any dummy string
        const award = 50
        const txIn = new TxIn('', -1,info)
        const txOut = new TxOut(address, award)
        const tx = new Transaction([txIn],[txOut])
        return tx
    }

    public static createTx(senderPubKey:string, senderPriKey:string, receiverPubKey:string, receiveAmount:number){
        const utxo = this.findUTXO(senderPubKey)
        let sumUTXO = 0
        const txIns = []
        const txOuts = []
        let i = 0
        utxo.forEach((val)=>{
            //the sum of UTXO of a pubkey
            sumUTXO+=val.amount
            // Create input object for each UTXO, sign the input by user private key
            i++
            txIns.push(new TxIn(val.id, i, senderPriKey))
        })

        if(sumUTXO < receiveAmount){
            // Not enough money
            return //exception
        }
        for(let n=0;n<txIns.length;n++){
            // verify the input by signature
            const checker = signature.verify(utxo[i].address, txIns[i].signature, txIns[i].msgHash())
            if(!checker){
                return //exception 
            }
        }
        //Create out put to receiver by PP2K
        txOuts.push(new TxOut(receiverPubKey, receiveAmount))
        //return change to the sender
        const change = sumUTXO - receiveAmount
        txOuts.push(new TxOut(senderPubKey, change))

        const tx = new Transaction(txIns,txOuts)
        // tx.setId()
        return tx
    }

    public static findUTXO(senderPubKey){
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
