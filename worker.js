// eslint-disable-next-line @typescript-eslint/no-var-requires
const { workerData, parentPort } = require('worker_threads')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SHA256 } = require("crypto-js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hexToBinary = require("hex-to-binary");

const { index, previousHash, timestamp, data, difficulty } = workerData;

const hashBlock = function(index, previousBlockHash, timestamp, data, nonce) {
    return SHA256(index + previousBlockHash + timestamp + data + nonce).toString();
}

const hashMatchesDifficulty = (hash, difficulty) => {
    const hashBuffer = hexToBinary(hash);
    const requiredPrefix = "0".repeat(difficulty);
    const matches = hashBuffer.startsWith(requiredPrefix) === true;

    return matches;
}


const findNonce = function(index, previousHash, timestamp, data, difficulty) {
    let nonce = 0;

    while(true) {
        const hash = hashBlock(index, previousHash, timestamp, data, nonce);
        if(hashMatchesDifficulty(hash, difficulty)) {
            return {
                nonce,
                hash
            };
        }

        nonce++;
    }
}

const { nonce, hash } = findNonce(index, previousHash, timestamp, data, difficulty);

// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
parentPort.postMessage({ nonce, hash })