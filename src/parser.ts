import {config} from './config';

const csv = require('fast-csv');
import * as fs from 'fs';

const file = './data/utxodump.csv';
if (!fs.existsSync(file)) {
    console.log('file not found', file);
    process.exit(1);
}

const parseFile = () => {
    const streamFromFile = fs.createReadStream(file);
    let line = 0;
    let count = 0;
    const parser = csv.parseStream(streamFromFile, {objectMode: true, headers: false});
    parser.on('error', (e) => {
        console.error("ERROR", e);
    }).on('data', data => {
            line++;
            const address = data[0];
            if (address && address.length > 5) {
                console.log(line, count++, address);
                const folder = address.substring(0, 5);
                const path = `${config.datadir}/${folder}/${address}`;
                fs.open(path, "wx", function (err, fd) {
                    // handle error
                    fs.close(fd, function (err) {
                        // handle error
                    });
                });
            }
        })
        .on('end', (rowCount: number) => {
            console.log("END", `Parsed ${rowCount} rows`);
        });
}

try {
    parseFile();
} catch (error) {
    console.log('parse error', error);
}
