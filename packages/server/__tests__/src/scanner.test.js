const fs = require('fs');
const fileType = require('file-type');
const isMp3 = require('../../src/libs/scanner/ismp3');
const MusicScanner = require('../../src/libs/scanner');

const resDir = `${process.cwd()}/packages/server/__tests__/resources`;

describe('Music scanner functions', () => {
    test('isMp3: it can both read strings and buffers', () => {
        expect(isMp3(`${resDir}/fake.mp3`)).toBeFalsy(); // text file with wrong extension

        const buffer = fs.readFileSync(`${resDir}/sample.mp3`);
        expect(fileType(buffer)).not.toBeNull();
        expect(isMp3(buffer)).toBeTruthy();
    });

/*     test('scanner', async () => {
        console.time('musicScanWithQueue');

        const paths = [
            '/home/ccastelli/Music/3) DA ASCOLTARE/ALTER BRIDGE - DISCOGRAPHY (2004-13) [CHANNELNEO]',
            '/home/ccastelli/Music/3) DA ASCOLTARE/ZZ Top - Discography (1970-2012)',
            '/home/ccastelli/Music/3) DA ASCOLTARE/ZZ Top - Discography (1970-2012)/OK',
            '/home/ccastelli/Music/3) DA ASCOLTARE/Portishead',
            '/home/ccastelli/Music/3) DA ASCOLTARE/Subsonica',
            '/home/ccastelli/Music/3) DA ASCOLTARE/Subsonica/Terrestre',
        ];

        const scanner = new MusicScanner({
            paths,
        });
        const res = await scanner.scan();
        console.log(res);
    }, 40000); */
});
