const csv = require('fast-csv');
const mysql = require('mysql2');
const LRU = require('lru-cache');
const stream = require('stream');
import * as fs from 'fs';
import {config} from './config';

const file = './data/utxodump.csv';
if (!fs.existsSync(file)) {
    console.log('file not found', file);
    process.exit(1);
}
const cache = new LRU({max: 1000000});
const loaded = new Set();
const HEADER = 'INSERT INTO address VALUES ';
const CHUNK_SIZE = 10000;

const parseFile = () => {
    const streamFromFile = fs.createReadStream(file);
    const result = fs.createWriteStream('dump.sql', {
        flags: 'a'
    });
    let line = 0;
    let count = 0;
    let chunk = [];
    const parser = csv.parseStream(streamFromFile, {objectMode: true, headers: false});
    parser.on('error', (e) => {
        console.error("ERROR", e);
    }).on('data', data => {
            line++;
            const address = data[0];
            if (config.start <= line && !cache.get(address)) {
                if (loaded.has(address)) {
                    cache.set(address, true);
                    console.log(line, 'loaded', address);
                } else {
                    console.log(line, count++, address);
                    loaded.add(address);
                    chunk.push(address);
                    cache.set(address, true);
                    if (chunk.length >= CHUNK_SIZE) {
                        parser.pause();
                        result.write(HEADER);
                        let f = true;
                        chunk.forEach(element => {
                            if(f) {
                                f = false;
                            } else {
                                result.write(",");
                            }
                            result.write("('");
                            result.write(element);
                            result.write("')");
                        });
                        result.write(";\n");

                        chunk = [];
                        console.log('flushed successfully:', count);
                        //result.end(()=> process.exit(0));
                        parser.resume();
                    }
                }
            }
        })
        .on('end', (rowCount: number) => {
            console.log("END", `Parsed ${rowCount} rows`);
            if(chunk.length) {
                result.write(HEADER);
                let f = true;
                chunk.forEach(element => {
                    if(f) {
                        f = false;
                    } else {
                        result.write(",");
                    }
                    result.write("('");
                    result.write(element);
                    result.write("')");
                });
                result.write(";\n");
            }
            result.end(()=> console.log('COMPLETED', line));
        });
}

try {
    const connection = mysql.createConnection(config.dbConnectionConfig);
    connection.query('select id from address')
        .on('error', function(err) {
            console.log('ERROR', err);
            process.exit(1);
        })
        .stream()
        .pipe(new stream.Transform({
            objectMode: true,
            transform: function(row,encoding,callback) {
                loaded.add(row.id);
                if (loaded.size % 100000 === 0) {
                    console.log('loaded:', loaded.size);
                }
                callback()
            }
        })).on('finish',() => {
            connection.end();
            console.log('pre loaded success - loaded:', loaded.size);
            parseFile();
        } );
} catch (error) {
    console.log('parse error', error);
}
