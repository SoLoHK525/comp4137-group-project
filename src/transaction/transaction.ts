import { SHA256 } from 'crypto-js';
import { BlockService } from 'src/block/block.service';

var EC = require('elliptic').ec;
var ec = new EC('secp256k1');

export class Transaction {
    id: string;
    txIns: TxIn[];
    txOuts: TxOut[];

    constructor(ins: Array<TxIn>, outs: Array<TxOut>) {
        this.id = this.setId();
        this.txIns = ins;
        this.txOuts = outs;
    }

    setId(): string {
        const txInContent: string = null;
        if (this instanceof RegularTx) {
            const txInContent: string = this.txIns
                .map((regularTxIn: RegularTxIn) => regularTxIn.txOutId + regularTxIn.txOutIndex)
                .reduce((a, b) => a + b, '');
        } else {
            const txInContent: string = this.txIns
                .map((coinbaseTxIn: CoinbaseTxIn) => coinbaseTxIn.blockHeight)
                .reduce((a, b) => a + b, '');
        }

        const txOutContent: string = this.txOuts
            .map((txOuts: TxOut) => txOuts.address + txOuts.amount)
            .reduce((a, b) => a + b, '');

        return SHA256(SHA256(txInContent + txOutContent)).toString();
    }

    public static createRegularTx(
        senderPubKey: string,
        senderPriKey: string,
        receiverPubKey: string,
        receiveAmount: number,
        fee: number,
    ) {
        const utxo = this.findUTXO(senderPubKey);
        let sumUTXO = 0;
        const txIns = [];
        const txOuts = [];
        let i = 0;
        utxo.forEach((val) => {
            //the sum of UTXO of a pubkey
            sumUTXO += val.amount;
            // Create input object for each UTXO, sign the input by user private key
            i++;
            txIns.push(new RegularTxIn(val.id, i, senderPriKey));
        });
        const totalAmountToSpend = receiveAmount + fee;
        if (sumUTXO < totalAmountToSpend) {
            // Not enough money
            return; //exception
        }
        for (let n = 0; n < txIns.length; n++) {
            // verify the input by signature
            const checker = Signature.verify(utxo[i].address, txIns[i].signature, txIns[i].msgHash());
            if (!checker) {
                return; //exception
            }
        }
        //Create out put to receiver by PP2K
        txOuts.push(new TxOut(receiverPubKey, receiveAmount));
        //return change to the sender
        const change = sumUTXO - receiveAmount - fee;
        if (change > 0) {
            txOuts.push(new TxOut(senderPubKey, change));
        }
        const tx = new Transaction(txIns, txOuts);
        // tx.setId()
        return tx;
    }

    public static findUTXO(senderPubKey) {
        const allBlock = [];
        const allTxOut = [];
        const allTxIn = [];
        allBlock.forEach((block) => {
            const txs = block.txs;
            txs.forEach((tx) => {
                const txOuts = tx.txOuts;
                txOuts.forEach((out) => {
                    if (out.address == senderPubKey) {
                        allTxOut.push(out);
                    }
                });
            });
        });
        return [];
    }

    // public static UTXOPool(senderPubKey){
    //     const firstBlock = "First Block Address"
    //     let currentBlock = firstBlock
    //     let utxo = []
    //     do{
    //         const txs = currentBlock.txs
    //         txs.array.forEach(tx => {
    //             // add all the transaction output into utxo
    //             const outs = tx.txOuts
    //             utxo = [...utxo, ...outs]
    //             // remove used money in utxo
    //             const ins = tx.txIns
    //             for (let i =0;i<ins.length;i++){
    //                 // remove inTxs in utxo
    //             }
    //         });
    //         currentBlock = currentBlock.nextBlock
    //     } while (currentBlock != null)

    //     return utxo
    // }
}

export class RegularTx extends Transaction {
    txIns: RegularTxIn[];

    constructor(ins: Array<RegularTxIn>, outs: Array<TxOut>) {
        super(ins, outs);
    }
}

export class CoinBaseTx extends Transaction {
    txIns: CoinbaseTxIn[];

    constructor(ins: Array<CoinbaseTxIn>, outs: Array<TxOut>, blockService: BlockService) {
        const txIn = blockService.getBlockHeight();
        super(ins, outs);
    }
}

class TxIn {
    constructor() {}
}

export class RegularTxIn extends TxIn {
    txOutId: string;
    txOutIndex: number;
    signature: string;

    constructor(txOutId: string, txOutIndex: number, priKey) {
        super();
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.signature = this.createSig(priKey, this.msgHash());
    }

    createSig(priKey: string, msg: string): string {
        return Signature.sign(priKey, msg);
    }

    msgHash(): string {
        return SHA256(SHA256(this.txOutId + this.txOutIndex)).toString();
    }
}

export class CoinbaseTxIn extends TxIn {
    public blockHeight: number;

    constructor(blockHeight: number) {
        super();
        this.blockHeight = blockHeight;
    }
}

export class TxOut {
    address: string; //public key
    amount: number;

    constructor(address: string, amount: number) {
        this.address = address;
        this.amount = amount;
    }
}

export class Signature {
    static sign(priKey: string, msg: string): string {
        const key = ec.keyFromPrivate(priKey, 'hex');
        const signature = key.sign(msg).toDER();
        return signature;
    }

    static verify(pubKey: string, sig: string, msg: string): boolean {
        const key = ec.keyFromPublic(pubKey, 'hex');
        return key.verify(msg, sig);
    }
}
