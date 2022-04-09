import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { BlockService } from '../block/block.service';

@Controller()
export class AppController {
    private readonly logger = new Logger(AppController.name);
    constructor(private readonly appService: AppService, private readonly blockService: BlockService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('/block/manifest')
    getBlockManifest() {
        return this.blockService.blockManifest;
    }
}
