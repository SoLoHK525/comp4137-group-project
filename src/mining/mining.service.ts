import { Injectable, Logger } from '@nestjs/common';
import { BlockService } from '../block/block.service';
import { Block, BlockData } from '../block/block.interface';
import * as moment from 'moment';
import { Timeout } from '@nestjs/schedule';
import { Worker } from 'worker_threads';
import { CoinBaseTx, CoinbaseTxIn, TxOut } from "../transaction/transaction.interface";
import { SHA256 } from "crypto-js";
import { TransactionService } from "../transaction/transaction.service";
import { TransactionPoolService } from "../transaction-pool/transaction-pool.service";

@Injectable()
export class MiningService {
    private readonly BLOCK_GENERATION_INTERVAL = 10; // 10 secs per block
    private readonly DIFFICULTY_ADJUSTMENT_INTERVAL = 10; // adjust per 10 blocks

    private readonly logger = new Logger(MiningService.name);

    constructor(
        private readonly blockService: BlockService,
        private readonly transactionPoolService: TransactionPoolService
    ) {}

    private async onApplicationBootstrap() {
        //
    }

    @Timeout(5000)
    async generateNewBlock() {
        try {
            // TODO: fix coinbase tx

            while (true) {
                this.logger.verbose('Started to mine new blocks');
                const transactions = await this.transactionPoolService.pollTransactions();

                const coinbaseTx = new CoinBaseTx(
                    new CoinbaseTxIn(this.blockService.getBlockHeight()),
                    [new TxOut("-----BEGIN PUBLIC KEY-----\n" +
                        "MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgH78oV+TH/zaEWsddK7Q4sAYYn5G\n" +
                        "YtykKjSOdlh01o6ilIWS4j8d1Gjti+bqvhm0hMjePJ+UqqS7J03adgx9oMCb0m2o\n" +
                        "zA4mYgvwEHbIuiDvXef/IAWLVJBdstpkTgZ2h9bHh2cAtjyVBT3BrDu17aEVPmRh\n" +
                        "L0RKhsLaxdEmkV89AgMBAAE=\n" +
                        "-----END PUBLIC KEY-----", 50)]
                );

                const blockData = new BlockData([coinbaseTx, ...transactions]);

                try {
                    const previousBlock = await this.blockService.getLatestBlock();
                    const timestamp = moment.now() / 1000;
                    const difficulty = await this.getDifficulty();

                    const index = previousBlock?.index + 1 || 1;
                    const previousBlockHash =
                        previousBlock?.currentBlockHash ||
                        '0000000000000000000000000000000000000000000000000000000000000000';
                    const block = await this.findBlock(index, previousBlockHash, timestamp, blockData, difficulty);
                    this.logger.warn(`Mined block ${block.currentBlockHash}!`);
                    await this.blockService.addBlock(block);
                } catch (err) {
                    this.logger.error('Error while attempting to mine new blocks, err: ' + err.message);
                    this.logger.error(err.stack);
                }
            }
        } catch (err) {
            this.logger.error(err.message);
            this.logger.error(err.stack);
        }
    }

    async findBlock(index: number, previousHash: string, timestamp: number, data: BlockData, difficulty: number) {
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
            const {nonce, hash} = workerData;
            const merkleTreeRoot = await data.getMerkleTreeRoot();

            return new Block(index, data, timestamp, previousHash, hash, merkleTreeRoot, difficulty, nonce);
        }
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

        if (timeTaken < timeExpected / 2) {
            return prevAdjustmentBlock.difficulty + 1;
        } else if (timeTaken > timeExpected * 2) {
            return prevAdjustmentBlock.difficulty - 1;
        } else {
            return prevAdjustmentBlock.difficulty;
        }
    }
}
