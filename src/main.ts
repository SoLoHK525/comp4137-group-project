/* eslint-disable */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { BlockService } from './block/block.service';
import { MiningService } from './mining/mining.service';
import { NetworkService } from './network/network.service';
import { TransactionService } from './transaction/transaction.service';
import { MintService } from './mint/mint.service';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileService } from './file/file.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // You can access the service here for testing (Only use this method in main.ts)
    const blockService = app.get(BlockService);
    const miningService = app.get(MiningService);
    const mintService = app.get(MintService);
    const networkService = app.get(NetworkService);
    const transactionService = app.get(TransactionService);
    const fileService = app.get(FileService);

    const port = app.get<ConfigService>(ConfigService).get<number>('port');

    await app.listen(port);

    Logger.verbose(`Server listening on http://localhost:${port}`);
    Logger.verbose(`Storage base path: ${fileService.basePath}`);
    // Example of adding a block with BlockService
    // const hashes = blockService.getBlockHashes();
    // const index = hashes.length;
    //
    // await blockService.addBlock(
    //   new Block(
    //     index,
    //     'hi',
    //     getUnixTimestamp(),
    //     blockService.getLatestBlockHash() || '',
    //   ),
    // );
}

bootstrap();
