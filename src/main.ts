/* eslint-disable */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { BlockService } from './block/block.service';
import { Block } from './block/block.interface';
import { getUnixTimestamp } from './utils/time';
import { MiningService } from "./mining/mining.service";
import { NetworkService } from "./network/network.service";
import { TransactionService } from "./transaction/transaction.service";
import { MintService } from "./mint/mint.service";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const port = 8124;
  const app = await NestFactory.create(AppModule);
  await app.listen(port);

  Logger.verbose(`Server listening on http://localhost:${port}`);

  // You can access the service here for testing (Only use this method in main.ts)
  const blockService = app.get(BlockService);
  const miningService = app.get(MiningService);
  const mintService = app.get(MintService);
  const networkService = app.get(NetworkService);
  const transactionService = app.get(TransactionService);

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
