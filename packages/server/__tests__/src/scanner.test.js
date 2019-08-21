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
