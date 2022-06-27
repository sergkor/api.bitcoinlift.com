import { parseStream } from "fast-csv";
const mysql = require('mysql2');
import * as fs from 'fs';
import {config} from './config';

const file = './data/utxodump.csv';
if (!fs.existsSync(file)) {
    console.log('file not found', file);
    process.exit(1);
}
try {
    const stream = fs.createReadStream(file);
    let count = 0;
    const connection = mysql.createConnection(config.dbConnectionConfig);
    parseStream(stream, {headers: true})
            .on('error', (e) => {
                console.error("ERROR", e);

            })
            .on('data', row => {
                console.log(count++, row.address);
                connection.execute(
                    'INSERT INTO address (id) VALUES (?)',
                    [row.address],(err, res) => {
                        console.log(err, res);
                    });
            })
            .on('end', (rowCount: number) => {
                connection.end();
                console.log("END", `Parsed ${rowCount} rows`);
            });
} catch (error) {
    console.log('parse error', error);
}
