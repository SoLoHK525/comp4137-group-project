import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileModule } from '../file/file.module';
import { BlockService } from "../block/block.service";
import { MiningService } from "../mining/mining.service";
import { MintService } from "../mint/mint.service";
import { NetworkService } from "../network/network.service";
import { TransactionService } from "../transaction/transaction.service";

@Module({
  imports: [FileModule],
  controllers: [AppController],
  providers: [AppService, BlockService, MiningService, MintService, NetworkService, TransactionService],
})
export class AppModule {}
