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
    parseStream(stream, {headers: true, ignoreEmpty: true, trim: true, discardUnmappedColumns: true})
            .on('error', (e) => {
                console.error("ERROR", e);

            })
            .on('data', row => {
                console.log(count++, row.address);
                parseStream.pause();
                connection.execute(
                    'INSERT INTO address (id) VALUES (?)',
                    [row.address],(err, res) => {
                        if (err) console.log(err);
                        parseStream.resume();
                    });
            })
            .on('end', (rowCount: number) => {
                console.log("END", `Parsed ${rowCount} rows`);
                connection.end();
            });
} catch (error) {
    console.log('parse error', error);
}
