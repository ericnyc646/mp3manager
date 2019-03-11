const path = require('path');
const FileMetadata = require('../../../src/models/db/FileMetadata');
const File = require('../../../src/models/db/File');
const { copyFile } = require('../../libs/testUtils');

describe('FileMetadata model', () => {
    const filePath = path.join(__dirname, '../../resources/sample.mp3');

    it('can do an upsert on the same file', async () => {
        const { mainFolder, files } = copyFile({
            filePath,
            numCopies: 1,
        });

        const copyFilePath = `${mainFolder}/${files[0]}`;

        const mp3 = {
            name: 'A sample',
            path: copyFilePath,
        };

        const res = await File.insert(mp3);
        const { affectedRows, insertId, warningStatus } = res;
        expect(affectedRows).toEqual(1);
        expect(insertId).toEqual(1);
        expect(warningStatus).toEqual(0);

        const insertedFile = await File.get({ fields: 'md5_hash', where: `id = ${insertId}` });
        const { md5_hash } = insertedFile[0];

        const result = await FileMetadata.upsert(copyFilePath, md5_hash);
        const { affectedRows: rows, insertId: insId, warningStatus: warns } = result;

        expect(rows).toEqual(1);
        expect(insId).toEqual(1);
        expect(warns).toEqual(0);
    });
});
