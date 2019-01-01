import fs from 'fs';
import fileType from 'file-type';
import _ from 'underscore';
import { isMp3, musicScan, cleanPaths } from '../../src/libs/MusicScanner';

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

    test('cleanPaths: avoid path duplications', () => {
        const paths = [
            resDir, `${resDir}/fake`, '/totally/invented', resDir, '../',
            `${resDir}/tree/level1.1`, `${process.cwd()}/packages/server/src`,
        ];

        const expectedResult = [resDir, `${process.cwd()}/packages/server/src`];
        expect(_.difference(expectedResult, cleanPaths(paths)).length === 0).toBeTruthy();
    });
});
