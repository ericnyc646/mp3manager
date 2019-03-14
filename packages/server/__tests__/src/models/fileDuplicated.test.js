const path = require('path');
const _ = require('underscore');
const FileDuplicated = require('../../../src/models/db/FileDuplicated');
const { mp3hash } = require('../../../src/libs/utils');

describe('FileDuplicated model', () => {
    it('can do an insert and verify that a file exists', async () => {
        const filePath = path.join(__dirname, '../../resources/sample.mp3');
        const md5 = await mp3hash(filePath);

        const result = await FileDuplicated.insert({ md5_hash: md5, path: filePath });
        const { affectedRows, insertId, warningStatus } = result;
        expect(affectedRows).toEqual(1);
        expect(_.isNumber(insertId)).toBeTruthy(); // other files may be inserted for other tests
        expect(warningStatus).toEqual(0);

        const exists = await FileDuplicated.isDuplicated(md5, filePath);
        expect(exists).toBeTruthy();
    });
});
