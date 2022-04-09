import { Injectable, Logger } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { Block, Manifest } from './block.interface';
import {Transaction, TxOut, UTXO} from "../transaction/transaction.interface";
import {TransactionService} from "../transaction/transaction.service";

@Injectable()
export class BlockService {
    private readonly path = 'block';
    private readonly manifestFilePath = `${this.path}/manifest.json`;
    private readonly logger = new Logger(BlockService.name);
    private manifest: Manifest;

    public get blockManifest() {
        return this.manifest;
    }

    constructor(private fileService: FileService) {}

    private async onApplicationBootstrap() {
        if (this.fileService.exists(this.manifestFilePath)) {
            this.manifest = await this.getManifest();
        } else {
            this.logger.verbose('Block manifest not found, creating manifest');
            this.manifest = new Manifest();
            await this.saveManifest();
        }
    }

  getBlockHeight(): number {
    const manifest = this.manifest;
    return manifest.numberOfBlocks;
  }

    getBlockHash(index: number) {
        return this.manifest.blocks[index];
    }

    getBlockHashes(): string[] {
        const manifest = this.manifest;
        return manifest.blocks;
    }

    size() {
        return this.manifest.blocks.length;
    }

    getLatestBlockHash(): string | null {
        if (this.manifest.blocks.length == 0) {
            return null;
        }

        return this.manifest.blocks[this.manifest.blocks.length - 1];
    }

    getLatestBlock(): Promise<Block> {
        return this.getBlock(this.getLatestBlockHash());
    }

    async getBlock(hash: string): Promise<Block> {
        const filePath = this.getBlockFilePath(hash);

        if (this.fileService.exists(filePath)) {
            const file = await this.fileService.load(filePath);
            const block: Block = JSON.parse(file.toString());
            return new Block(
                block.index,
                block.data,
                block.timestamp,
                block.previousBlockHash,
                block.currentBlockHash,
                block.difficulty,
                block.nonce,
            );
        }

        return null;
    }

    async addBlock(block: Block): Promise<boolean> {
        if (!(await this.isValidNewBlock(block))) {
            this.logger.verbose(`Block ${block.currentBlockHash} is not valid to be added to the chain`);
        }

        this.logger.verbose('Adding block: ' + JSON.stringify(block));

        if (!this.manifest.addBlock(block)) {
            return false;
        }

        await this.saveManifest();

        const filePath = this.getBlockFilePath(block.hash());
        await this.fileService.save(filePath, JSON.stringify(block));

  public getAllUTXO(): UTXO[]{
    const outs = <UTXO[]>[]
    // loop all the blocks
    for(let i=0; i<this.manifest.blocks.length;i++){
      const currentBlockAddress = this.manifest.blocks[i]
      const currentBlock = Object.setPrototypeOf(this.getBlock(currentBlockAddress), Block.prototype)
      const currentTx = currentBlock.data // need to convert to list of Transaction
      // loop all the transaction
      currentTx.forEach(currentTx =>{
        const txID = currentTx.id
        const txOuts = currentTx.txOuts
        const txIns = currentTx.txIns
        // Create UTXO object for each TxOutPut, push to UTXO
        txOuts.forEach((txout, i)=>{
          outs.push(new UTXO(txID, txout, i)) //create UTXO obj that store tx, txid and index
        })
        // Remove the spent money
        txIns.forEach((spend)=>{
          const outID = spend.txOutId;
          const outIndex = spend.txOutIndex;
          const indexOfTx = outs.findIndex(obj=>{
            return obj.txId == outID && obj.txIndex == outIndex
          })
          outs.splice(indexOfTx, 1);
        })
      })
    }
    return outs
  }

  public getUXTO(pubKey:string):UTXO[]{
    const allUTXO = this.getAllUTXO()
    const utxoOfpubKey = <UTXO[]>[]

    allUTXO.forEach(obj =>{
      const output = obj.txOut
      if(output.address == pubKey){
        utxoOfpubKey.push(obj)
      }else{
        // pass
      }
    })
    return utxoOfpubKey
  }

  // public findUTXO(pubKey:string):any{
  //   let allOuts = this.getAllOutputTx(pubKey)
  //   let utxo = <TxOut[]>[]
  //   for(let i=0; i<this.manifest.blocks.length;i++) {
  //     const currentBlockAddress = this.manifest.blocks[i]
  //     const currentBlock = Object.setPrototypeOf(this.getBlock(currentBlockAddress), Block.prototype)
  //     const blockID = currentBlock.id
  //   }
  //   return utxo
  // }
        return true;
    }

    async isValidNewBlock(newBlock: Block) {
        const previousBlock = await this.getLatestBlock();

        if (previousBlock == null) {
            return true;
        }

        if (previousBlock.index + 1 !== newBlock.index) {
            console.log('invalid index');
            return false;
        } else if (previousBlock.hash() !== newBlock.previousBlockHash) {
            console.log('invalid previous block hash: ' + previousBlock.hash());
            return false;
        } else if (newBlock.hash() !== newBlock.currentBlockHash) {
            console.log('invalid current block hash');
            return false;
        }

        return true;
    }

    private getBlockFilePath(hash: string) {
        return `${this.path}/block_${hash}.json`;
    }

    private async getManifest(): Promise<Manifest> {
        this.logger.verbose('Loading block manifest');
        const file = await this.fileService.load(this.manifestFilePath);
        return Manifest.from(JSON.parse(file.toString()));
    }

    private async saveManifest(): Promise<boolean> {
        this.logger.verbose('Saving block manifest');
        await this.fileService.save(this.manifestFilePath, JSON.stringify(this.manifest, null, 4));
        return true;
    }
}
