import { Injectable, Logger } from '@nestjs/common';
import { FileService } from '../file/file.service';
import { Block, Manifest } from './block.interface';

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

  getBlockHashes(): string[] {
    const manifest = this.manifest;
    return manifest.blocks;
  }

  getLatestBlockHash(): string | null {
    if (this.manifest.blocks.length == 0) {
      return null;
    }

    return this.manifest.blocks[this.manifest.blocks.length - 1];
  }

  async getBlock(hash: string): Promise<Block> {
    const filePath = this.getBlockFilePath(hash);

    if (this.fileService.exists(filePath)) {
      const file = await this.fileService.load(filePath);
      return JSON.parse(file.toString());
    }

    return null;
  }

  async addBlock(block: Block): Promise<boolean> {
    this.logger.verbose('Adding block: ' + JSON.stringify(block));

    if (!this.manifest.addBlock(block)) {
      return false;
    }

    await this.saveManifest();

    const filePath = this.getBlockFilePath(block.hash());
    await this.fileService.save(filePath, JSON.stringify(block));

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
    await this.fileService.save(this.manifestFilePath, JSON.stringify(this.manifest));
    return true;
  }
}
