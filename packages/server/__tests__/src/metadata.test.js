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

        /*
           acoustid_id: '787a3632-5572-4804-b726-c32dfe5c2ebd',
           album: 'Who Made Who',
           albumartist: 'AC/DC',
           albumartistsort: 'AC/DC',
           artist: 'AC/DC',
           artists: [ 'AC/DC', [length]: 1 ],
           artistsort: 'AC/DC',
           asin: 'B0000CF35K',
           barcode: '696998021112',
           catalognumber: [ 'E 80211', [length]: 1 ],
           composer: [ 'Angus Young', 'Malcolm Young', [length]: 2 ],
           composersort: [ 'Young, Angus', 'Young, Malcolm', [length]: 2 ],
           date: '2003-10-14',
           disk: { no: 1, of: 1 },
           encodersettings: 'Audiograbber 1.80, LAME dll 3.85, 160 Kbit/s, Joint Stereo, Normal quality'
           genre: [ 'Hard Rock', [length]: 1 ],
           isrc: [ 'AUAP08000047', [length]: 1 ],
           label: [ 'Epic', [length]: 1 ],
           language: 'eng',
           media: '12" Vinyl',
           musicbrainz_workid: 'a5d611a1-353c-395f-9a93-b2880a3292ed',
           musicbrainz_albumid: '6dbe3e47-e54f-3e82-8cee-a91a4d3c40c5',
           musicbrainz_recordingid: '877c7bff-2485-4a6d-b831-e251e6eeefa0',
           musicbrainz_artistid: [ '66c662b6-6e2f-4930-8610-912e24c63ed1', [length]: 1 ],
           musicbrainz_albumartistid: [ '66c662b6-6e2f-4930-8610-912e24c63ed1', [length]: 1 ],
           musicbrainz_releasegroupid: '4e34b10b-ed62-37cc-9347-33a0bebfb058',
           musicbrainz_trackid: '3dcb0654-b83c-3b49-85da-6aa52e6ca3c5',
           originaldate: '1986-05-20',
           originalyear: 1986,
           lyricist: [ 'Mark Knopfler', [length]: 1 ],
           picture: [ { format: 'image/jpeg', data: <Buffer ff d8 ff ...
           releasecountry: 'US',
           releasestatus: 'official',
           releasetype: [ 'album', 'compilation', 'soundtrack', [length]: 3 ],
           script: 'Latn',
           title: 'You Shook Me All Night Long',
           track: { no: 2, of: 9 },
           writer: [ 'Brian Johnson', 'Angus Young', 'Malcolm Young', [length]: 3 ],
           year: 2003,
        */
    });

    it('can calculate MD5 without metadata', async () => {
        const resDir = `${process.cwd()}/packages/server/__tests__/resources`;
        const resFile = `${resDir}/Under The Ice (Scene edit).mp3`;
        const md5 = await mp3hash(resFile);
        expect(md5).toEqual('79b9629de784c871fdb938bd5a5549c8');
    });
});
