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
});
