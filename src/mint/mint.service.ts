import { Injectable } from '@nestjs/common';
import { BlockService } from "../block/block.service";

@Injectable()
export class MintService {
  txIns: ConinbaseTxIn[];
  txOuts: TxOut[];
  
  constructor(private readonly blockService: BlockService) {}

  private async onApplicationBootstrap() {
    // When the application starts
    const COINBASE_AMOUNT:number=50;
     this.txIns = ConinbaseTxIn[1];
      // this.txIns[0]= new ConinbaseTxIn();

    this.txOuts = TxOut[1]
    this.txOuts[0] = new TxOut("123",COINBASE_AMOUNT);

    let coninBase :Transaction;
    coninBase.txIn = this.txIns;
    coninBase.txOut = this.txOuts;
    coninBase.id = getTransactionId(coninBase);
  }
  
}

class Transaction{
  public id:string;
  public txIn:ConinbaseTxIn[];
  public txOut:TxOut[];
}

class TxOut{
  public address:string;
  public amount:number;

  constructor(address:string,amount:number){
    this.address=address;
    this.amount=amount;
  }
}

class ConinbaseTxIn{
  public blockHeight:number;

  constructor(blockHeight:number){
    this.blockHeight=blockHeight
  }
  }

  const getTransactionId=(transaction:Transaction): string => {
    const txInContent:string=transaction.txIn
    .map((txIn:ConinbaseTxIn)=>txIn.blockHeight) 
    .reduce((a,b)=>a+b,'');


    const txOutContent:string=transaction.txOut
    .map((txOut:TxOut)=>txOut.address+txOut.amount)
    .reduce((a,b)=>a+b,'');
    return CryptoJS.SHA256(txInContent+txOutContent).toString();
    };
