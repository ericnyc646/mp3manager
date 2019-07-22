const fs = require('fs');
const os = require('os');
const path = require('path');
const fileType = require('file-type');
const _ = require('underscore');
const mm = require('music-metadata');
const EyeD3 = require('../../src/libs/eyeD3');
const isMp3 = require('../../src/libs/scanner/ismp3');
const MusicScanner = require('../../src/libs/scanner');
const { copyFile, moveFile } = require('../libs/testUtils');
const logger = require('../../src/libs/logger');

const resDir = `${process.cwd()}/packages/server/__tests__/resources`;

describe('Music scanner functions', () => {
    afterAll((done) => {
        logger.close();
        setTimeout(() => { done(); }, 500);
    });

    it('it can both read strings and buffers', () => {
        expect(isMp3(`${resDir}/fake.mp3`)).toBeFalsy(); // text file with wrong extension

        const buffer = fs.readFileSync(`${resDir}/sample.mp3`);
        expect(fileType(buffer)).not.toBeNull();
        expect(isMp3(buffer)).toBeTruthy();
    });

    fit('can scan directories recursively', async () => {
        const scanner = new MusicScanner({
            paths: ['D:/Musica'],
            keepInMemory: true,
        });

        const res = await scanner.scan();
        console.log(res);

        // const expectedArrayResult = [
        //     'Under The Ice (Scene edit).mp3',
        //     'sample.mp3',
        //     '1.1.mp3',
        //     '1.1.1.mp3',
        //     '3.1.mp3',
        //     '1.2.mp3',
        // ];
        // expect(musicFilesBasenames.sort().every((value, index) => value === expectedArrayResult.sort()[index])).toBeTruthy();
    }, 86400000);

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
        expect(affectedRows).toBe(1);
        expect(insertId).not.toBeNull();
        expect(isDuplicated).toBeTruthy();

        const foundInTable = await FileDuplicated.isDuplicated(md5, anotherPath);
        expect(foundInTable).toBeTruthy();
    });

    it('can validate paths passed to the constructor', () => {
        expect(() => MusicScanner.mapPaths([
            os.homedir(),
            __filename,
        ])).toThrowError(/is not a directory/);

        const RES_DIR = `${__dirname}/../../`;

        const paths = [
            os.homedir(),
            `${RES_DIR}/__tests__/resources/tree/level1.1`,
            RES_DIR,
        ];

        const reducedPaths = MusicScanner.mapPaths(paths);
        expect((_.difference(reducedPaths, [RES_DIR, os.homedir()])).length === 0).toBeTruthy();
    });
});
