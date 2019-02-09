const path = require('path');
const _ = require('underscore');
const { File, getFileHash } = require('../../../src/models/db/File');

describe('File model', () => {
    const filePath = path.join(__dirname, '../../resources/sample.mp3');

    test('getFileHash', async () => {
        const hash = await getFileHash('md5', filePath);
        expect(hash).toEqual('057019f5a99230478b1498ab1d7d8894');
    });

    test('File methods', async () => {
        const mp3 = {
            name: 'A sample',
            path: filePath,
            bitrate: 320,
            genre: 'pop',
            rating: 2,
        };
        /* INSERT */
        let res = await File.insert(mp3);
        const { affectedRows, insertId, warningStatus } = res;
        expect(affectedRows).toEqual(1);
        expect(insertId).toEqual(1);
        expect(warningStatus).toEqual(0);

        /* SELECT WITHOUT CONDITIONS AND SORTING */
        res = await File.get({ fields: [
            'id', 'name', 'atime', 'size',
            'md5_hash', 'acousticid_hash',
        ] });

        expect(res.length).toBe(1);

        const { id, name, atime, size, md5_hash, acousticid_hash } = res[0];
        expect(id).toBe(1);
        expect(name).toBe('A sample');
        expect(_.isNumber(size)).toBeTruthy();
        expect(_.isDate(atime)).toBeTruthy();
        expect(!_.isEmpty(acousticid_hash)).toBeTruthy();
        expect(md5_hash).toEqual('057019f5a99230478b1498ab1d7d8894');
    });
});
