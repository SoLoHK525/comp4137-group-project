import { Injectable, Logger } from '@nestjs/common';
import { NetworkService } from "../network/network.service";
import { Timeout } from "@nestjs/schedule";
import { BroadcastMessage } from "./broadcast.interface";
import { SHA256, enc } from "crypto-js";
import { safeStringify } from "../utils/json";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import * as moment from "moment";

@Injectable()
export class BroadcastService {
    private logger = new Logger(BroadcastService.name);
    private broadcastedMessage = new Set<string>();

    constructor(
        private readonly networkService: NetworkService,
        private eventEmitter: EventEmitter2
    ) {
    }

    @Timeout(3000)
    async testBroadcast() {
        this.logger.verbose("Testing broadcast");

        const {acknowledged, broadcasted, failed, total} = await this.broadcastEvent("testEvent", {
            k: 2,
            p: 100
        })

        this.logger.verbose(`acknowledged: ${acknowledged}, broadcasted: ${broadcasted}, failed: ${failed}, total: ${total}`);
    }

    @OnEvent("broadcast.testEvent")
    testEvent(payload: any) {
        this.logger.debug("on testEvent broadcast: " + safeStringify(payload));
    }

    hashPayload(payload: any) {
        return SHA256(SHA256(payload)).toString(enc.Hex);
    }

    onBroadcastEvent(event: string, payload: any, digest: string) {
        // ignored broadcasted messages
        if (!this.broadcastedMessage.has(digest)) {
            this.eventEmitter.emit(`broadcast.${event}`, payload);
            this.broadcastEvent(event, payload);
            this.broadcastedMessage.add(digest);
            this.logger.debug(`Received broadcast event: ${event}, payload: ${payload}`);
        }
    }

    async broadcastEvent(event: string, payload: any) {
        let broadcasted = 0;
        let acknowledged = 0;
        let failed = 0

        const peers = this.networkService.getPeers();

        const payloadWithTimestamp = {
            timestamp: moment().toISOString(),
            ...payload
        };

        const jsonPayload = safeStringify(payloadWithTimestamp);

        if (!jsonPayload) {
            return null;
        }

        const encapsulatedData: BroadcastMessage = {
            event,
            payload: payloadWithTimestamp,
            digest: this.hashPayload(jsonPayload)
        }

        const promises = [];

        for (const peer of peers) {
            const request = this.networkService.request("POST", `/broadcast`, encapsulatedData, peer).then((success) => {
                if (success) {
                    broadcasted++;
                } else {
                    acknowledged++;
                }
            }).catch((err) => {
                failed++;

                this.logger.debug(`Broadcast failed ${err.response?.message || err.message}`);
            });

            promises.push(request);
        }

        await Promise.all(promises);

        return {
            broadcasted,
            acknowledged,
            failed,
            total: peers.length
        }
    }
}
