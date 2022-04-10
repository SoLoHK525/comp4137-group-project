import { Controller, Get } from '@nestjs/common';
import { BlockService } from "./block.service";

@Controller('block')
export class BlockController {
    constructor(
        private readonly blockService: BlockService
    ) {
    }

    @Get("/")
    async getBlocks() {
        const blockHashes = this.blockService.getBlockHashes();

        return await Promise.all(blockHashes.map(t => {
            return this.blockService.getBlock(t);
        }));
    }
}
