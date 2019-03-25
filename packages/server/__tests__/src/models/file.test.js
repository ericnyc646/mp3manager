const path = require('path');
const _ = require('underscore');
const File = require('../../../src/models/db/File');
const FileMetadata = require('../../../src/models/db/FileMetadata');
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
        expect(_.isNumber(insertId)).toBeTruthy(); // other files may be inserted for other tests
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

    it('can do a join between file and file_metadata', async () => {
        const { mainFolder, files } = copyFile({
            filePath,
            numCopies: 1,
        });

        const newFilePath = `${mainFolder}/${files[0]}`;

        const res = await File.insert({
            name: 'CopyFile',
            path: newFilePath,
        });
        const { insertId } = res;
        expect(_.isNumber(insertId)).toBeTruthy();

        const file = await File.getById(insertId);
        const { md5_hash } = file;
        expect(md5_hash.length).toBe(32);

        const resMeta = await FileMetadata.upsert(newFilePath, md5_hash);
        expect(_.isNumber(resMeta.insertId)).toBeTruthy();

        const [result] = await File.getFileAndMetadata(md5_hash);

        expect(result.name).toEqual(file.name);
        expect(result.atime).toEqual(file.atime);
        expect(result.mtime).toEqual(file.mtime);
        expect(result.size).toEqual(file.size);
        expect(result.title).toEqual('You Can Use');
        expect(result.artist).toEqual('Captive Portal');
        expect(result.genre).toEqual('["Electronic"]');
        expect(result.album).toEqual('Toy Sounds Vol. 1');
    });
});
