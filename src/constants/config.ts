import { argv } from '../utils/arguments';

export default () => ({
    host: '127.0.0.1',
    port: argv.port,
    client: argv.client,
});
