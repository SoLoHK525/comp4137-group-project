import { BadRequestException, Body, Controller, InternalServerErrorException, Post } from '@nestjs/common';
import { BroadcastService } from "./broadcast.service";
import { safeStringify } from "../utils/json";

@Controller('broadcast')
export class BroadcastController {
    constructor(private readonly broadcastService: BroadcastService) {
    }

    @Post("/")
    handleBroadcast(
        @Body("event") event: string,
        @Body("payload") payload: any,
        @Body("digest") digest: string
    ) {
        if(!event || !payload || !digest) {
            throw new BadRequestException("Invalid broadcast message");
        }

        if(this.broadcastService.hashPayload(safeStringify(payload)) != digest) {
            throw new InternalServerErrorException("Incorrect message digest.");
        }

        this.broadcastService.onBroadcastEvent(event, payload, digest);

        return true;
    }
}
