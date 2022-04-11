import { Injectable, Logger } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { Block, BlockData, Manifest } from './block.interface';
import { TransactionPoolService } from '../transaction-pool/transaction-pool.service';
import { OnEvent } from '@nestjs/event-emitter';
import { NetworkService } from '../network/network.service';

@Injectable()
export class BlockService {
    private readonly path = 'block';
    private readonly manifestFilePath = `${this.path}/manifest.json`;
    private readonly logger = new Logger(BlockService.name);
    private manifest: Manifest;

    public get blockManifest() {
        return this.manifest;
    }

    constructor(
        private fileService: FileService,
        private transactionPoolService: TransactionPoolService,
        private networkService: NetworkService,
    ) {}

    private async onApplicationBootstrap() {
        if (this.fileService.exists(this.manifestFilePath)) {
            this.manifest = await this.getManifest();
        } else {
            this.logger.verbose('Block manifest not found, creating manifest');
            this.manifest = new Manifest();
            await this.saveManifest();
        }
    }

    @OnEvent('network.newPeer')
    private async onNewPeer(address: string) {
        const blocks = await Promise.all(
            await this.networkService.request<Block[]>('GET', '/block', null, address).then((blocks) => {
                return blocks.map(async (block) => {
                    const blockData = new BlockData(block.data.transactions);

                    return new Block(
                        block.index,
                        blockData,
                        block.timestamp,
                        block.previousBlockHash,
                        block.currentBlockHash,
                        await blockData.getMerkleTreeRoot(),
                        block.difficulty,
                        block.nonce,
                    );
                });
            }),
        );

        const localBlockLength = this.manifest.blocks.length;

        if (blocks.length > localBlockLength) {
            if (localBlockLength > 0) {
                const index = blocks.findIndex((block) => {
                    return block.previousBlockHash === this.getLatestBlockHash();
                });

                if (index != -1) {
                    this.logger.warn('Appending block:');

                    for (const block of blocks.slice(index)) {
                        await this.addBlock(block);
                    }
                } else {
                    this.logger.error('Chains are incompatible, not gonna switch to another chain');
                }
            } else {
                this.logger.warn('Appending block:');

                for (const block of blocks) {
                    await this.addBlock(block);
                }
            }
        }
    }

    private async deleteAllBlocks() {
        const hashes = this.getBlockHashes();

        return Promise.all(
            hashes.map((hash) => {
                return this.fileService.delete(this.getBlockFilePath(hash));
            }),
        );
    }

    public getBlockHeight(): number {
        const manifest = this.manifest;
        return manifest.numberOfBlocks;
    }

    public getBlockHash(index: number) {
        return this.manifest.blocks[index];
    }

    public getBlockHashes(): string[] {
        const manifest = this.manifest;
        return manifest.blocks;
    }

    public size() {
        return this.manifest.blocks.length;
    }

    public getLatestBlockHash(): string | null {
        if (this.manifest.blocks.length == 0) {
            return null;
        }

        return this.manifest.blocks[this.manifest.blocks.length - 1];
    }

    public getLatestBlock(): Promise<Block> {
        return this.getBlock(this.getLatestBlockHash());
    }

    public async getBlock(hash: string): Promise<Block> {
        const filePath = this.getBlockFilePath(hash);

        if (this.fileService.exists(filePath)) {
            const file = await this.fileService.load(filePath);
            const block: Block = JSON.parse(file.toString());
            const blockData = new BlockData(block.data.transactions);

            return new Block(
                block.index,
                blockData,
                block.timestamp,
                block.previousBlockHash,
                block.currentBlockHash,
                await blockData.getMerkleTreeRoot(),
                block.difficulty,
                block.nonce,
            );
        }

        return null;
    }

    public async addBlock(block: Block): Promise<boolean> {
        if (!(await this.isValidNewBlock(block))) {
            this.logger.verbose(`Block ${block.currentBlockHash} is not valid to be added to the chain`);
        }

        this.logger.verbose('Adding block: ' + block.currentBlockHash);

        if (!this.manifest.addBlock(block)) {
            return false;
        }
        await this.saveManifest();

        const filePath = this.getBlockFilePath(block.hash());
        await this.fileService.save(filePath, JSON.stringify(block, null, 4));
        await this.transactionPoolService.removeTransactions(block.data.transactions);
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

    public async isValidNewBlock(newBlock: Block) {
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
