const mm = require('music-metadata');
const { mp3hash } = require('../../src/libs/utils');

describe('ID3 Tags', () => {
    it('can read metadata', async () => {
        const resDir = `${process.cwd()}/packages/server/__tests__/resources`;
        const resFile = `${resDir}/Under The Ice (Scene edit).mp3`;
        const metadata = await mm.parseFile(resFile, { duration: true });
        const { format, common } = metadata;
        const { tagTypes, lossless, dataformat, bitrate, sampleRate, numberOfChannels,
            codecProfile, encoder, duration } = format;
        const { track, title, artists, artist, album,
            albumartist, picture, year, comment } = common;

        // format
        expect(tagTypes[0]).toEqual('ID3v2.4');
        expect(lossless).toBeFalsy();
        expect(dataformat).toEqual('mp3');
        expect(bitrate).toBe(320000);
        expect(sampleRate).toBe(44100);
        expect(numberOfChannels).toBe(2);
        expect(codecProfile).toEqual('CBR');
        expect(encoder).toEqual('LAME3.99r');
        expect(parseInt(duration, 10)).toBe(128);

        // common
        expect(track.no).toBe(1);
        expect(title).toEqual('Under The Ice (Scene edit)');
        expect(artists[0]).toEqual('UNKLE');
        expect(artist).toEqual('UNKLE');
        expect(album).toEqual('Lives Of The Artists: Follow Me Down - Soundtrack');
        expect(year).toBe(2010);
        expect(comment[0]).toEqual('Visit http://relentlessenergy.bandcamp.com');

        const { format: imageFormat, type, description, data } = picture[0];
        expect(imageFormat).toEqual('image/jpeg');
        expect(type).toEqual('Cover (front)');
        expect(description).toEqual('cover');
        expect(Buffer.isBuffer(data)).toBeTruthy();
        expect(albumartist).toEqual('UNKLE');
    });

    it('can calculate MD5 without metadata', async () => {
        const resDir = `${process.cwd()}/packages/server/__tests__/resources`;
        const resFile = `${resDir}/Under The Ice (Scene edit).mp3`;
        const md5 = await mp3hash(resFile);
        expect(md5).toEqual('79b9629de784c871fdb938bd5a5549c8');
    });

    fit('Testing a song', async () => {
        const songPath = 'D:/Musica/Classica/Wagner - La Cavalcata delle Walkirie.mp3';
        const metadata = await mm.parseFile(songPath, { duration: true });
        console.log(metadata);
    });
});
