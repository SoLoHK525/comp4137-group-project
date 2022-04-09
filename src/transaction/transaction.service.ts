import { Injectable,Logger } from '@nestjs/common';
import { BlockService } from "../block/block.service";
import {signature, Transaction, TxIn, TxOut} from "../transaction/transaction.interface";
import { SHA256 } from 'crypto-js';
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { BroadcastService } from 'src/broadcast/broadcast.service';


@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly blockService: BlockService, private readonly broadcastService: BroadcastService) {}

  onApplicationBootstrap() {
    // When the application starts
  }

  public static createTx(senderPubKey:string, senderPriKey:string, receiverPubKey:string, receiveAmount:number, fee:number){
    const utxos = this.findUTXO(senderPubKey)
    let sumUTXO = 0
    const txIns = []
    const txOuts = []
    utxos.forEach((utxo)=>{
        //the sum of UTXO of a pubkey
        sumUTXO += utxo.txOut.amount
        // Create input object for each UTXO, sign the input by user private key
        txIns.push(new TxIn(utxo.txId, utxo.txIndex, senderPriKey))
    })
    const totalAmountToSpend = receiveAmount+fee
    if(sumUTXO < totalAmountToSpend){
        // Not enough money
        return //exception
    }
    for(let i=0; i<txIns.length; i++){
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
    tx.setId()
    return tx
  }

  public static findUTXO(sendPubKey: string){
    // TODO
    return []
  }

  broadcast(transaction: Transaction): boolean{
    this.broadcastService.broadcastEvent("transaction", transaction);
    return true;
  }

  @OnEvent("broadcast.transaction")
  receiveTransaction(transaction: Transaction){
    //add all utxo to the utxo pool
  }
}
