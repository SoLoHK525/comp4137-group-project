import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { HandshakeChallenge, RequestMethod } from './network.interface';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { randomBytes } from 'crypto';
import { Timeout } from '@nestjs/schedule';

@Injectable()
export class NetworkService {
    private address: string;

    private peers = new Set<string>();

    private challenges = new Map<string, HandshakeChallenge>();
    private pendingChallenges = new Set<string>();

    private readonly logger = new Logger(NetworkService.name);

    constructor(private configService: ConfigService) {
        this.address = this.configService.get<string>('host') + ':' + this.configService.get<number>('port');
    }

    private async onApplicationBootstrap() {
        // When the application starts
    }

    public async request<T>(method: RequestMethod, url: string, data: any, target?: string) {
        return axios
            .request<T>({
                url,
                method,
                data,
                baseURL: `http://${target}/`,
            })
            .then((response) => {
                return response.data;
            });
    }

    @Timeout(2000)
    initialHandshake() {
        this.logger.verbose('Initializing Handshakes');

        const knownClients = this.configService.get<string | string[]>('client');

        if (knownClients) {
            if (typeof knownClients === 'string') {
                this.handshake(knownClients).catch(() => {
                    this.logger.error(`Failed to handshake ${knownClients}`);
                });
            } else {
                knownClients.forEach((client) => {
                    this.handshake(client).catch(() => {
                        this.logger.error(`Failed to handshake ${client}`);
                    });
                });
            }
        }
    }

    handshake(target: string) {
        this.logger.verbose(`Initializing handhsake to ${target}`);

        return this.request<boolean>(
            'POST',
            '/network/handshake',
            {
                address: this.address,
            },
            target,
        ).then((success) => {
            if (success) {
                this.pendingChallenges.add(target);
                this.logger.verbose('Awaiting challenge...');
            }
        });
        // .catch(err => {
        //     console.log(err.request.path);
        // })
    }

    sendHandshakeVerification(target: string, code: string) {
        if (!this.pendingChallenges.has(target)) {
            return;
        }

        this.pendingChallenges.delete(target);
        this.logger.verbose(`Sending challenge code ${code} to ${target}`);

        return this.request<boolean>(
            'POST',
            '/network/handshakeVerify',
            {
                address: this.address,
                code,
            },
            target,
        )
            .then((success) => {
                if (success) {
                    this.addPeer(target);
                }
            })
            .catch((err) => {
                this.logger.error(
                    `Failed to send handshake verification: ${err.response?.data.message || err.message}`,
                );
            });
    }

    sendChallenge(address: string) {
        const challenge: HandshakeChallenge = {
            code: randomBytes(8).toString('base64'),
            created_at: moment().toISOString(),
        };

        this.challenges.set(address, challenge);

        this.logger.verbose(`Sending challenge ${challenge.code} to ${address}`);

        this.request(
            'POST',
            '/network/handshakeChallenge',
            {
                address: this.address,
                code: challenge.code,
            },
            address,
        ).catch((err) => {
            this.logger.error(`Failed to send challenge to ${address}, reason: ${err.message}`);
        });
    }

    verifyChallenge(address: string, code: string) {
        if (this.challenges.has(address)) {
            return this.challenges.get(address).code === code;
        }
        return false;
    }

    addPeer(address: string) {
        if (address === this.address) return;

        if (!this.peers.has(address)) {
            this.peers.add(address);
            this.requestPeerList(address);
            this.logger.verbose(`Added new peer: ${address}`);
        }
    }

    requestPeerList(source: string) {
        this.request<string[]>('GET', '/network/peers', null, source)
            .then((peers) => {
                peers.forEach((peer) => {
                    this.peers.add(peer);
                });
            })
            .catch((err) => {
                this.logger.error(`Failed to fetch peers from ${source}, reason: ${err.message}`);
            });
    }

    getPeers() {
        return Array.from(this.peers);
    }
}
