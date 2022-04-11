import yargs from 'yargs';

export const argv = yargs(process.argv.slice(2))
    .options({
        port: {
            alias: 'p',
            type: 'number',
            default: 5012,
            describe: 'Port of the client',
        },
        client: {
            type: 'array',
            describe: 'Known peer clients',
        },
        noMine: {
            type: 'boolean',
            describe: 'no-mining',
            default: false
        },
        wallet: {
            type: 'string',
            describe: 'Wallet address'
        }
    })
    .parse();
