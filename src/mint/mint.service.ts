import { Injectable } from '@nestjs/common';
import { BlockService } from "../block/block.service";

@Injectable()
export class MintService {
  constructor(private readonly blockService: BlockService) {}

  private async onApplicationBootstrap() {
    // When the application starts
  }
}
