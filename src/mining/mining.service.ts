import { Injectable, Logger } from '@nestjs/common';
import { BlockService } from '../block/block.service';
import { Block } from '../block/block.interface';
import * as moment from 'moment';
import { Timeout } from '@nestjs/schedule';
import { Worker } from 'worker_threads';

@Injectable()
export class MiningService {
    private readonly BLOCK_GENERATION_INTERVAL = 3; // 10 minutes
    private readonly DIFFICULTY_ADJUSTMENT_INTERVAL = 10; // 10 minutes

    private readonly logger = new Logger(MiningService.name);

    constructor(private readonly blockService: BlockService) {}

    private async onApplicationBootstrap() {
        //
    }

    @Timeout(5000)
    async generateNewBlock(data: string) {
        let i = 0;
        while (true) {
            this.logger.verbose('Started to mine new blocks');
            try {
                const previousBlock = await this.blockService.getLatestBlock();
                const timestamp = moment.now() / 1000;
                const difficulty = await this.getDifficulty();

                const index = previousBlock?.index + 1 || 1;
                const previousBlockHash =
                    previousBlock?.currentBlockHash ||
                    '0000000000000000000000000000000000000000000000000000000000000000';
                const block = await this.findBlock(index, previousBlockHash, timestamp, data, difficulty);
                this.logger.warn(`Mined block ${block.currentBlockHash}!`);
                await this.blockService.addBlock(block);
            } catch (err) {
                this.logger.error('Error while attempting to mine new blocks, err: ' + err.message);
                this.logger.error(err.stack);
            }

            //if(i++ > 5) return;
        }
    }

    async findBlock(index: number, previousHash: string, timestamp: number, data: string, difficulty: number) {
        const workerData: {
            nonce: number;
            hash: string;
        } = await new Promise((resolve, reject) => {
            const worker = new Worker('./worker.js', {
                workerData: {
                    index,
                    previousHash,
                    timestamp,
                    data,
                    difficulty,
                },
            });

            worker.on('message', resolve);
            worker.on('error', (err) => {
                this.logger.error('Hash worker process failed');
                reject(err);
            });

            worker.on('exit', () => {
                this.logger.debug('worked exited');
            });
        });

        if (workerData) {
            const { nonce, hash } = workerData;
            return new Block(index, data, timestamp, previousHash, hash, difficulty, nonce);
        }

        // while(true) {
        //     const hash = Block.hash(index, previousHash, timestamp, data, nonce);
        //     if(Block.hashMatchesDifficulty(hash, difficulty)) {
        //         return new Block(index, data, timestamp, previousHash, hash, difficulty, nonce);
        //     }
        //     nonce++;
        //     if(nonce % 100 == 0) {
        //         //this.logger.verbose("Tried 10 hashes, still going");
        //     }
        // }
    }

    async getDifficulty() {
        const latestBlock = await this.blockService.getLatestBlock();

        if (latestBlock === null) {
            return 20;
        }

        if (latestBlock.index % this.DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
            return this.getAdjustedDifficulty();
        } else {
            return latestBlock.difficulty;
        }
    }

    async getAdjustedDifficulty() {
        const latestBlock = await this.blockService.getLatestBlock();

        const chainSize = this.blockService.size();
        const prevAdjustmentBlockIndex = chainSize - this.DIFFICULTY_ADJUSTMENT_INTERVAL;
        const prevAdjustmentBlockHash = this.blockService.getBlockHash(prevAdjustmentBlockIndex);
        const prevAdjustmentBlock = await this.blockService.getBlock(prevAdjustmentBlockHash);

        const timeExpected = this.BLOCK_GENERATION_INTERVAL * this.DIFFICULTY_ADJUSTMENT_INTERVAL;
        const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;

        console.log(timeTaken);
        console.log(timeExpected);

        if (timeTaken < timeExpected / 2) {
            return prevAdjustmentBlock.difficulty + 1;
        } else if (timeTaken > timeExpected * 2) {
            return prevAdjustmentBlock.difficulty - 1;
        } else {
            return prevAdjustmentBlock.difficulty;
        }
    }
}
