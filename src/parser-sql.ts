const csv = require('fast-csv');
import * as fs from 'fs';

const file = './data/utxodump.csv';
if (!fs.existsSync(file)) {
    console.log('file not found', file);
    process.exit(1);
}
const HEADER = 'INSERT INTO address_1 VALUES ';
const CHUNK_SIZE = 50000;
const cache = new Array(100e8);
cache.fill('');

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
            if(address && !cache.includes(address)) {
                console.log(line, count++, address);
                chunk.push(address);
                cache.push(address);
                cache.shift();
            }
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
    parseFile();
} catch (error) {
    console.log('parse error', error);
}
