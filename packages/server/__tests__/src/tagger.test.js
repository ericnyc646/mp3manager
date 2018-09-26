import cp from 'child_process';
// import util from 'util';
import _ from 'underscore';

const metadata = require('music-metadata');

const resDir = `${process.cwd()}/packages/server/__tests__/resources`;

describe('MP3 metadata management', () => {
    test('eyeD3 existence test', (done) => {
        cp.exec('eyeD3 --help', { cwd: resDir, encoding: 'utf8' }, (error, stdout, stderr) => {
            if (stderr || error) {
                const err = stderr || error;
                if (err.includes('command not found')) {
                    let warnMessage = "It seems you don't have eyeD3 installed.\n";
                    warnMessage += 'Use pip install eyeD3 python-magic-bin: ';
                    warnMessage += 'https://eyed3.readthedocs.io/en/latest/installation.html';
                    console.warn(warnMessage);
                }
            } else {
                console.log(stdout);
            }
            done();
        });
    });

    test('music-metadata: reading metatags', async () => {
        const data = await metadata.parseFile(`${resDir}/sample.mp3`, { duration: true, native: true });
        // full list here: https://github.com/borewit/music-metadata#format
        expect(_.difference(data.format.tagTypes, ['ID3v2.3', 'ID3v1']).length === 0).toBeTruthy();
        expect(data.format.lossless).toBeFalsy();
        expect(data.format.bitrate).toEqual(320000);
        expect(data.format.sampleRate).toEqual(44100);
        expect(data.format.numberOfChannels).toEqual(2);
        expect(data.format.codecProfile).toEqual('CBR');
        expect(Math.round(data.format.duration)).toEqual(15);
        expect(data.format.encoder.trim()).toEqual('LAME3.97');

        const v2 = data.native['ID3v2.3'][0];
        expect(v2.id).toEqual('TALB');
        expect(v2.value).toEqual('Toy Sounds Vol. 1');
        const v1 = data.native.ID3v1[0];
        expect(v1.id).toEqual('title');
        expect(v1.value).toEqual('You Can Use');

        // Full list here: https://github.com/Borewit/music-metadata/blob/master/doc/common_metadata.md#common-metadata
        const { track, disk, album, artist, comment, copyright, genre,
            rating, year, date, title, picture } = data.common;

        expect(track.no).toEqual(1);
        expect(track.of).toBeNull();
        expect(disk.no).toBeNull();
        expect(disk.of).toBeNull();
        expect(album).toEqual('Toy Sounds Vol. 1');
        expect(artist).toEqual('Captive Portal');
        expect(comment[0]).toEqual('Trimmed with WavePad');
        expect(copyright).toEqual('Attribution-ShareAlike: http://creativecommons.org/licenses/by-sa/4.0/');
        expect(genre[0]).toEqual('Electronic');
        expect(rating[0].rating).toEqual(1);
        expect(_.isEmpty(rating[0].source)).toBeTruthy();
        expect(year).toEqual(2018);
        expect(date.toString()).toEqual('2018-09-07T11:21:12');
        expect(title).toEqual('You Can Use');
        expect(picture[0].format).toEqual('image/png');
        expect(_.isEmpty(picture[0].description)).toBeTruthy();
        expect(Buffer.isBuffer(picture[0].data)).toBeTruthy();

        // console.log(util.inspect(data, { showHidden: false, depth: null }));
    });
});
