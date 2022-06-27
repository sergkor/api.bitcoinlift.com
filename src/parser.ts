const csv = require('fast-csv');
const mysql = require('mysql2');
const LRU = require('lru-cache');
import * as fs from 'fs';
import {config} from './config';

const file = './data/utxodump.csv';
if (!fs.existsSync(file)) {
    console.log('file not found', file);
    process.exit(1);
}
const cache = new LRU({max: 1000000});
try {
    const stream = fs.createReadStream(file);
    let count = 0;
    const connection = mysql.createConnection(config.dbConnectionConfig);
    const parser = csv.parseStream(stream, {objectMode: true, headers: false});
    parser.on('error', (e) => {
                console.error("ERROR", e);
            })
            .on('data', data => {
                console.log(count++, data[0]);
                if (!cache.get(data[0])) {
                    parser.pause();
                    connection.execute(
                        'INSERT INTO address (id) VALUES (?)',
                        [data[0]],(err, res) => {
                            if (err) {
                                console.log(err);
                            }
                            cache.set(data[0], true);
                            parser.resume();
                        });
                }
            })
            .on('end', (rowCount: number) => {
                console.log("END", `Parsed ${rowCount} rows`);
                connection.end();
            });
} catch (error) {
    console.log('parse error', error);
}
