import fs from 'fs';
import fileType from 'file-type';
import { isMp3, musicScan } from '../../src/libs/musicscanner';

const resDir = `${process.cwd()}/packages/server/__tests__/resources`;

describe('Music scanner functions', () => {
    test('isMp3: it can both read strings and buffers', () => {
        expect(isMp3(`${resDir}/fake.mp3`)).toBeFalsy(); // text file with wrong extension

        const buffer = fs.readFileSync(`${resDir}/sample.mp3`);
        expect(fileType(buffer)).not.toBeNull();
        expect(isMp3(fs.readFileSync(`${resDir}/sample.mp3`))).toBeTruthy();
    });

    test('musicScan: able to scan a tree', async () => {
        expect(musicScan().then((files) => files)).rejects.toThrow('you must specify a list of paths');

        let files;
        files = await musicScan({ paths: [`${resDir}/tree/level1.1`], recursive: false });
        // FIXME: readdir strips away the base path, returning just the name
        expect(files.length).toBe(1);
        expect(files[0]).toEqual('1.1.mp3');
    });
});
