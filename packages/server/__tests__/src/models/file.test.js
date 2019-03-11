const path = require('path');
const _ = require('underscore');
const File = require('../../../src/models/db/File');
const { copyFile } = require('../../libs/testUtils');

describe('File model', () => {
    const filePath = path.join(__dirname, '../../resources/sample.mp3');

    it('can insert and get a file from DB', async () => {
        const mp3 = {
            name: 'A sample',
            path: filePath,
        };
        /* INSERT */
        let res = await File.insert(mp3);
        const { affectedRows, insertId, warningStatus } = res;
        expect(affectedRows).toEqual(1);
        expect(insertId).toEqual(1);
        expect(warningStatus).toEqual(0);

        /* SELECT WITHOUT CONDITIONS AND SORTING */
        res = await File.get({
            fields: [
                'id', 'name', 'atime', 'size', 'md5_hash',
            ],
            where: 'name = :name',
            namedPlaceholders: { name: 'A sample' },
        });

        expect(res.length).toBe(1);

        const { id, name, atime, size, md5_hash } = res[0];
        expect(id).toBe(1);
        expect(name).toBe('A sample');
        expect(_.isNumber(size)).toBeTruthy();
        expect(_.isDate(atime)).toBeTruthy();
        expect(md5_hash).toEqual('5db1ef2c0e0b409a5f1d50bc8227d144');
    }, 10000);

    it('can batch insert multiple files', async () => {
        const { mainFolder, files } = copyFile({
            filePath,
            numCopies: 3,
        });

        const params = files.map((file) => ({
            name: path.basename(file, '.mp3'),
            path: `${mainFolder}/${file}`,
        }));

        const affectedRows = await File.batchInsert(params);
        expect(affectedRows).toBe(3);

        const res = await File.get({
            fields: ['name'],
            where: "name LIKE 'copy_'",
        });

        expect(res.length).toBe(3);
    });
});
