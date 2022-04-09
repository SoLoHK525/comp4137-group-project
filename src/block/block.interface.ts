import { SHA256 } from 'crypto-js';
import { getUnixTimestamp } from '../utils/time';
import { time } from 'cron';
import * as hexToBinary from 'hex-to-binary';
import {Transaction, TxOut} from "../transaction/transaction.interface";
import {BlockService} from "./block.service";

export class Block {
    index: number;
    data: string;
    timestamp: number;
    previousBlockHash: string;
    currentBlockHash: string;
    difficulty: number;
    nonce: number;

    constructor(
        index: number,
        data: string,
        timestamp: number,
        previousBlockHash: string,
        currentBlockHash: string,
        difficulty: number,
        nonce: number,
    ) {
        this.index = index;
        this.data = data;
        this.timestamp = timestamp;
        this.previousBlockHash = previousBlockHash;
        this.difficulty = difficulty;
        this.nonce = nonce;
        this.currentBlockHash = this.hash();
    }

    public hash() {
        return Block.hash(this.index, this.previousBlockHash, this.timestamp, this.data, this.nonce);
    }

    public static hashMatchesDifficulty(hash: string, difficulty: number) {
        const hashBuffer = hexToBinary(hash);
        const requiredPrefix = '0'.repeat(difficulty);
        const matches = hashBuffer.startsWith(requiredPrefix) === true;

        return matches;
    }

    public static hash(index: number, previousBlockHash: string, timestamp: number, data: string, nonce: number) {
        return SHA256(index + previousBlockHash + timestamp + data + nonce).toString();
    }
}

export class Manifest {
    numberOfBlocks: number;
    blocks: string[];
    lastUpdated: number;

  utxo:[TxOut];
  txPool:[Transaction];

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
