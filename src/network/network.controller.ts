import { BadRequestException, Body, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { NetworkService } from "./network.service";

@Controller('network')
export class NetworkController {
    constructor(private readonly networkService: NetworkService) {
    }

    @Get("peers")
    getPeers() {
        return this.networkService.getPeers();
    }

    @Post("handshake")
    handshake(@Body("address") sourceAddress: string) {
        if (!sourceAddress) {
            throw new BadRequestException("No sourceAddress is provided");
        }

        this.networkService.sendChallenge(sourceAddress);

        return true;
    }

    @Post("handshakeVerify")
    handshakeVerify(
        @Body("address") address: string,
        @Body("code") code: string
    ) {
        if (!address || !code) {
            throw new BadRequestException("Missing parameters");
        }

        if (this.networkService.verifyChallenge(address, code)) {
            this.networkService.addPeer(address);
            return true;
        } else {
            throw new UnauthorizedException("Challenge Failed");
        }
    }

    @Post("handshakeChallenge")
    handshakeChallenge(@Body("address") sourceAddress: string, @Body("code") code: string) {
        this.networkService.sendHandshakeVerification(sourceAddress, code);
        return true;
    }
}
