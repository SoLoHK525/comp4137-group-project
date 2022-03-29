import { Injectable } from '@nestjs/common';
import { BlockService } from "../block/block.service";

@Injectable()
export class TransactionService {
  constructor(private readonly blockService: BlockService) {}

  onApplicationBootstrap() {
    // When the application starts
  }
}
