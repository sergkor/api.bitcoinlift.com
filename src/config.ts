import * as package_json from '../package.json';

const {env} = process;
require('dotenv').config();
const nodeEnv = env.env ? env.env.toLowerCase() : 'dev';

export const config = {
    environment: nodeEnv,
    packageName: package_json.name,
    packageVersion: package_json.version,
    dbConnectionConfig: {
        host: env.host,
        user: env.user,
        password: env.password,
        database: env.database
    },
};
