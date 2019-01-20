/* import _ from 'underscore';
import MusicScanner from '../../src/libs/scanner';

describe('Music queue scanner functions', () => {
    test('musicScanWithQueue', async () => {
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
    }, 40000);
}); */
