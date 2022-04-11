import { Injectable, Logger } from '@nestjs/common';
import { BlockService } from '../block/block.service';
import { Block, BlockData } from '../block/block.interface';
import * as moment from 'moment';
import { Timeout } from '@nestjs/schedule';
import { Worker } from 'worker_threads';
import { CoinBaseTx, CoinbaseTxIn, TxOut } from "../transaction/transaction.interface";
import { TransactionPoolService } from "../transaction-pool/transaction-pool.service";
import { BroadcastService } from "../broadcast/broadcast.service";
import { OnEvent } from "@nestjs/event-emitter";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MiningService {
    private readonly BLOCK_GENERATION_INTERVAL = 30; // 30 secs per block
    private readonly DIFFICULTY_ADJUSTMENT_INTERVAL = 5; // adjust per 5 blocks

    private readonly logger = new Logger(MiningService.name);
    private worker: Worker;

    constructor(
        private readonly configService: ConfigService,
        private readonly blockService: BlockService,
        private readonly transactionPoolService: TransactionPoolService,
        private readonly broadcastService: BroadcastService
    ) {}

    private async onApplicationBootstrap() {
        //
    }

    @OnEvent("broadcast.blockMined")
    async onBlockMined(block: Block) {
        const blockData = new BlockData(block.data.transactions);

        block = new Block(
            block.index,
            blockData,
            block.timestamp,
            block.previousBlockHash,
            block.currentBlockHash,
            await blockData.getMerkleTreeRoot(),
            block.difficulty,
            block.nonce,
        );

        if(await this.blockService.isValidNewBlock(block)) {
            await this.blockService.addBlock(block);

            if(this.worker != null){
                await this.worker.terminate();
                this.logger.warn("Terminated worker");
            }
        }
    }

    @Timeout(5000)
    async generateNewBlock() {
        const noMine = this.configService.get<boolean>("noMine");
        const wallet = this.configService.get<string>("wallet");

        if(noMine || !wallet) {
            const message = noMine ? "Mining has been disabled with --noMine" : "No wallet address is specified";
            this.logger.warn(`Mining has been disabled in this node since ${message}`);
            return;
        }

        try {
            // TODO: fix coinbase tx
            while (true) {
                this.logger.verbose('Started to mine new blocks');
                const transactions = await this.transactionPoolService.pollTransactions();

                const coinbaseTx = new CoinBaseTx(
                    new CoinbaseTxIn(this.blockService.getBlockHeight()),
                    [new TxOut("04425a41b9a090b18e64ad0f716ead1b4626e4d8df55447ad451146d2ff92e40aca23c92b0e8df91307e38d27a1ef90ad45760444978fb4e84fdd91a62a7f38246", 50)]
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

                    this.broadcastService.broadcastEvent("blockMined", block).then((
                        {
                            broadcasted,
                            failed,
                            total
                        }
                    ) => {
                        this.logger.verbose(`Broadcasted new block to ${broadcasted} known nodes, ${failed} failed, ${total} total`)
                    });

                    await this.blockService.addBlock(block);
                } catch (err) {
                    if(err) {
                        this.logger.error('Error while attempting to mine new blocks, err: ' + err.message);
                        this.logger.error(err.stack);
                    }
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
                this.worker = null;
                reject(err);
            });

            worker.on('exit', () => {
                this.logger.debug('worked exited');
                this.worker = null;
                reject();
            });

            this.worker = worker;
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
            return 16;
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
