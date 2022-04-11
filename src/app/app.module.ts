import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileModule } from '../file/file.module';
import { BlockService } from '../block/block.service';
import { MiningService } from '../mining/mining.service';
import { MintService } from '../mint/mint.service';
import { NetworkService } from '../network/network.service';
import { TransactionService } from '../transaction/transaction.service';
import config from '../constants/config';
import { ConfigModule } from '@nestjs/config';
import { NetworkController } from '../network/network.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { BroadcastService } from '../broadcast/broadcast.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BroadcastController } from '../broadcast/broadcast.controller';
import { TransactionPoolService } from '../transaction-pool/transaction-pool.service';
import { TransactionController } from '../transaction/transaction.controller';
import { BlockController } from '../block/block.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [config],
            ignoreEnvFile: true,
            isGlobal: true,
        }),
        EventEmitterModule.forRoot({
            // set this to `true` to use wildcards
            wildcard: false,
            // the delimiter used to segment namespaces
            delimiter: '.',
            // set this to `true` if you want to emit the newListener event
            newListener: false,
            // set this to `true` if you want to emit the removeListener event
            removeListener: false,
            // the maximum amount of listeners that can be assigned to an event
            maxListeners: 10,
            // show event name in memory leak message when more than maximum amount of listeners is assigned
            verboseMemoryLeak: false,
            // disable throwing uncaughtException if an error event is emitted and it has no listeners
            ignoreErrors: false,
        }),
        ScheduleModule.forRoot(),
        FileModule,
    ],
    controllers: [AppController, NetworkController, BroadcastController, TransactionController, BlockController],
    providers: [
        AppService,
        BlockService,
        BroadcastService,
        MiningService,
        MintService,
        NetworkService,
        TransactionService,
        TransactionPoolService,
    ],
})
export class AppModule {}
