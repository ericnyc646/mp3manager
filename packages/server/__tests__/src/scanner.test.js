const fs = require('fs');
const path = require('path');
const fileType = require('file-type');
const mm = require('music-metadata');
const EyeD3 = require('../../src/libs/eyeD3');
const isMp3 = require('../../src/libs/scanner/ismp3');
const MusicScanner = require('../../src/libs/scanner');
const { copyFile } = require('../libs/testUtils');

const resDir = `${process.cwd()}/packages/server/__tests__/resources`;

describe('Music scanner functions', () => {
    it('it can both read strings and buffers', () => {
        expect(isMp3(`${resDir}/fake.mp3`)).toBeFalsy(); // text file with wrong extension

        const buffer = fs.readFileSync(`${resDir}/sample.mp3`);
        expect(fileType(buffer)).not.toBeNull();
        expect(isMp3(buffer)).toBeTruthy();
    });

    it('can mark files as scanned', async () => {
        const version = await EyeD3.version();
        expect(version).toEqual('0.8.9');

        // prepare test directory
        const { mainFolder, files } = copyFile({
            filePath: `${resDir}/Under The Ice (Scene edit).mp3`,
        });

        const newFileCopied = `${mainFolder}/${files[0]}`;
        expect(isMp3(newFileCopied)).toBeTruthy();

        await EyeD3.markFileAsScanned(newFileCopied);

        const { common: { comment } } = await mm.parseFile(newFileCopied);
        expect(comment.length).toBe(1);
        expect(comment[0].startsWith('MusicManager')).toBeTruthy();
    }, 50000);

    it('can scan directories recursively', async () => {
        const scanner = new MusicScanner({
            paths: [resDir],
            keepInMemory: true,
        });
        const res = await scanner.scan();
        const { jobsCompleted, totalFiles, errors, musicFiles } = res;
        expect(jobsCompleted).toBe(6); // 6 directories
        expect(totalFiles).toBe(6);
        expect(errors.length).toBe(0);

        const musicFilesBasenames = musicFiles.map((file) => path.basename(file));
        const expectedArrayResult = [
            'Under The Ice (Scene edit).mp3',
            'sample.mp3',
            '1.1.mp3',
            '1.1.1.mp3',
            '3.1.mp3',
            '1.2.mp3',
        ];
        expect(musicFilesBasenames.sort().every((value, index) =>
            value === expectedArrayResult.sort()[index])).toBeTruthy();
    });
});
