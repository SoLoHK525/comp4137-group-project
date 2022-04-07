import yargs from 'yargs';

export const argv = yargs(process.argv.slice(2))
    .options({
        port: {
            alias: 'p',
            type: 'number',
            default: 5012,
            describe: 'Port of the client',
        },
        peer: {
            type: 'array',
            describe: 'Know peers',
        },
    })
    .parse();
