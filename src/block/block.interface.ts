import { SHA256 } from 'crypto-js';
import { getUnixTimestamp } from '../utils/time';

export class Block {
  index: number;
  data: string;
  timestamp: number;
  previousBlockHash: string;
  currentBlockHash: string;
  
  constructor(index: number, data: string, timestamp: number, previousBlockHash: string, currentBlockHash: string) {
    this.index = index;
    this.data = data;
    this.timestamp = timestamp;
    this.previousBlockHash = previousBlockHash;
    this.currentBlockHash = this.hash();
  }

  public hash() {
    return SHA256(this.index + this.previousBlockHash + this.timestamp + this.data).toString();
  }
}

export class Manifest {
  numberOfBlocks: number;
  blocks: string[];
  lastUpdated: number;

  constructor(numberOfBlocks = 0, blocks: string[] = [], lastUpdated: number = getUnixTimestamp()) {
    this.numberOfBlocks = numberOfBlocks;
    this.blocks = blocks;
    this.lastUpdated = lastUpdated;
  }

  public addBlock(block: Block): boolean {
    if (this.blocks.length == 0 || block.previousBlockHash === this.blocks[this.blocks.length - 1]) {
      this.blocks.push(block.hash());
      this.numberOfBlocks = this.blocks.length;
      return true;
    }

    return false;
  }

  public static from(obj: any): Manifest {
    return new Manifest(obj.numberOfBlocks, obj.blocks, obj.lastUpdated);
  }
}
