import fs from 'fs';
import fileType from 'file-type';
import { isMp3, musicScan } from '../../src/libs/musicscanner';

const resDir = `${process.cwd()}/packages/server/__tests__/resources`;

describe('Music scanner functions', () => {
    test('isMp3: it can both read strings and buffers', () => {
        expect(isMp3(`${resDir}/fake.mp3`)).toBeFalsy(); // text file with wrong extension

        const buffer = fs.readFileSync(`${resDir}/sample.mp3`);
        expect(fileType(buffer)).not.toBeNull();
        expect(isMp3(buffer)).toBeTruthy();
    });

    test('musicScan: able to scan a tree', async () => {
        expect(musicScan().then((files) => files)).rejects.toThrow('you must specify a list of paths');

        const files = await musicScan({ paths: [`${resDir}/tree/level1.1`], recursive: false });
        expect(files.length).toBe(1);
        expect(files[0]).toEqual(`${resDir}/tree/level1.1/1.1.mp3`);
    });
});
