## Description
COMP4137 Blockchain Technology Group Project
21/22 Spring Semester

This project is built on top of [NestJS](https://nestjs.com), please refer to documentation for dependency injection and module lifecycle detail.

## Requirements
Node.js v14 or above with npm/yarn package manger.

## Installation
Yarn (Recommended):
```bash
$ yarn install
```

If you are using npm:
```bash
$ npm install
```

## Running the app
```bash
# Development
$ yarn start:dev

# Build the app and run
$ yarn build
$ node dist/main.js --port <port> --wallet <walletAddress> --client <peerNodeAddress>

# Relay-only node
$ node dist/main.js --port <port> --client <peerNodeAddress> --noMine
```

## Generate Wallet
```bash
# You can generate a wallet address using
$ yarn genKey
# or
$ npm run genKey


# Returns
{
  # public key
  pub: '04ce485f40b82b912c866e67a9cc52accadb4e19ad8e78b186c5f409ec629874a1a5d91bedd91bb87beeb0a7668c889fb3ee0f706266cb789da6add04b2e66d479',
  pri: '6d5c36dd6edc9163e477972731c7711a4b28f53206894f1c1c80dd732cd7ee67' # private key
}
```

## Folder Structure
    ./
    ├── /dist                    # Compiled JavaScript files 
    ├── /src                     # Source files (alternatively `lib` or `app`)
    │   ├── /app                 # App Module
    │   ├── /block               # Block Module
    │   ├── /broadcast           # Broadcast Module
    │   ├── /file                # File Module (File IO)
    │   ├── /mining              # Mining Module
    │   ├── /mint                # Mint Module
    │   ├── /network             # Network Module
    │   ├── /transaction         # Transaction Module
    │   ├── /transaction-pool    # Transaction Pool Module
    │   ├── /types               # Type files
    │   ├── /utils               # Utilities
    │   └── main.ts             # Application Entrypoint
    ├── /storage                 # App generated files (block data, etc.)
    ├── /test                    # Automated tests (not in use)
    ├── genKeyPair.js           # Script to generate wallet
    ├── worker.js               # Node.js worker for calculating nonce for mining
    └── README.md

## Module Structure
    ./<module>
    ├── *.interface.ts                 # Type/Class definition used by the module
    ├── *.module.ts                    # Module Root
    ├── *.service.ts                      # Service provided by the module (implementation exposing interface)
    └── README.md
