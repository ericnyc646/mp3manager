const fs = require('fs');
const path = require('path');
const fileType = require('file-type');
const _ = require('underscore');
const mm = require('music-metadata');
const File = require('../../src/models/db/File');
const FileMetaData = require('../../src/models/db/FileMetadata');
const FileDuplicated = require('../../src/models/db/FileDuplicated');
const EyeD3 = require('../../src/libs/eyeD3');
const isMp3 = require('../../src/libs/scanner/ismp3');
const MusicScanner = require('../../src/libs/scanner');
const { copyFile, moveFile } = require('../libs/testUtils');

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
        expect(version.startsWith('0.8')).toBeTruthy();

        // prepare test directory
        const { mainFolder, files } = copyFile({
            filePath: `${resDir}/Under The Ice (Scene edit).mp3`,
        });

        const newFileCopied = `${mainFolder}/${files[0]}`;
        expect(isMp3(newFileCopied)).toBeTruthy();

        await EyeD3.markFileAsScanned(newFileCopied);

        const { common: { comment } } = await mm.parseFile(newFileCopied);

        expect(!_.isEmpty(MusicScanner.getScannerComment(comment))).toBeTruthy();
        expect(comment.length).toBe(1);
        
        const parts = comment[0].split('-');
        expect(parts[0]).toEqual('MusicManager');
        expect(parts[1].length).toBe(32);
        expect(parts[2].length).toBe(13);
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
        expect(musicFilesBasenames.sort().every((value, index) => value === expectedArrayResult.sort()[index])).toBeTruthy();
    });

    it('can store the files taking care of duplicates', async () => {
        const { mainFolder, files } = copyFile({
            filePath: `${resDir}/Under The Ice (Scene edit).mp3`,
        });
        const newFileCopied = `${mainFolder}/${files[0]}`;

        // 1) insert, it's missing in the db --------------------------------------------------------
        let result = await MusicScanner.storeFile(newFileCopied);
        expect(result).toBeTruthy();

        let theFile = await File.get({
            fields: ['md5_hash', 'atime', 'mtime', 'modification_time'],
            where: 'path = :path',
            namedPlaceholders: { path: newFileCopied },
        });
        // eslint-disable-next-line
        let { md5_hash: md5, modification_time: modTime, atime } = theFile[0];
        expect(atime).not.toBeNull();
        expect(md5).not.toBeNull();
        expect(modTime).toBeNull();
        expect(theFile.length).toBe(1);

        const meta = await FileMetaData.get({
            fields: 'title',
            where: `md5_hash = "${md5}"`,
        });
        expect(meta[0].title).not.toBeNull();


        // 2) update, same file another path -------------------------------------------------------
        const newPath = moveFile(newFileCopied);
        result = await MusicScanner.storeFile(newPath);
        expect(result).toBeTruthy();

        theFile = await File.get({
            fields: ['md5_hash', 'modification_time'],
            where: `path = :newPath OR 
                    path = :newFileCopied`,
            namedPlaceholders: { newPath, newFileCopied },
        });
        expect(theFile.length).toBe(1);
        md5 = theFile[0].md5_hash;
        modTime = theFile[0].modification_time;
        expect(md5).not.toBeNull();
        expect(modTime).not.toBeNull();
        expect(theFile.length).toBe(1);

        // 3) duplicate file: md5 missing in the file but present in the db -----------------------
        const anotherPath = moveFile(newPath);
        await EyeD3.removeAllComments(anotherPath);

        const { affectedRows, insertId, isDuplicated, warningStatus } = await MusicScanner.storeFile(anotherPath);
        expect(warningStatus).toBe(0);
        expect(affectedRows).toBe(1)
        expect(insertId).not.toBeNull();
        expect(isDuplicated).toBeTruthy();

        const foundInTable = await FileDuplicated.isDuplicated(md5, anotherPath);
        expect(foundInTable).toBeTruthy();
    });
});
