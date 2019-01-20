import fs from 'fs';
import fileType from 'file-type';
import isMp3 from '../../src/libs/scanner/ismp3';
// import musicScan from '../../src/libs/scanner';

const resDir = `${process.cwd()}/packages/server/__tests__/resources`;

describe('Music scanner functions', () => {
    test('isMp3: it can both read strings and buffers', () => {
        expect(isMp3(`${resDir}/fake.mp3`)).toBeFalsy(); // text file with wrong extension

        const buffer = fs.readFileSync(`${resDir}/sample.mp3`);
        expect(fileType(buffer)).not.toBeNull();
        expect(isMp3(buffer)).toBeTruthy();
    });
});
