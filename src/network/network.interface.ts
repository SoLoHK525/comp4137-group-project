export type RequestMethod = "GET" | "POST";

export interface Peer {
    identifier: string;
    address: string;
}


export interface HandshakeChallenge {
    code: string;
    created_at: string;
}