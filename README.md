## Description
COMP4137 Blockchain Technology Group Project

This project is built on top of [NestJS](nestjs.com), please refer to documentation for dependency injection and module lifecycle detail.

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
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Folder Structure
    .
    ├── dist                    # Compiled files 
    ├── src                     # Source files (alternatively `lib` or `app`)
    │   ├── app                 # App Module
    │   ├── block               # Block Module
    │   ├── file                # File Module (File IO)
    │   ├── mining              # Mining Module
    │   ├── mint                # Mint Module
    │   ├── network             # Network Module
    │   ├── transaction         # Transaction Module
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
