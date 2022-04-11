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

## Folder Structure
    .
    ├── dist                    # Compiled JavaScript files 
    ├── src                     # Source files (alternatively `lib` or `app`)
    │   ├── app                 # App Module
    │   ├── block               # Block Module
    │   ├── broadcast           # Broadcast Module
    │   ├── file                # File Module (File IO)
    │   ├── mining              # Mining Module
    │   ├── mint                # Mint Module
    │   ├── network             # Network Module
    │   ├── transaction         # Transaction Module
    │   ├── transaction-pool    # Transaction Pool Module
    │   ├── types               # Type files
    │   ├── utils               # Utilities
    │   └── main.ts             # Application Entrypoint
    ├── storage                 # App generated files (block data, etc.)
    ├── test                    # Automated tests (not in use)
    └── README.md

## Module Structure
    .
    ├── *.interface.ts                 # Type/Class definition used by the module
    ├── *.module.ts                    # Module Root
    ├── *.service                      # Service provided by the module (implementation exposing interface)
    └── README.md
