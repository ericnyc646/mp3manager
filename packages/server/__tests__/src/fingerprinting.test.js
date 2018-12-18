import path from 'path';
import fs from 'fs';
import { getAcusticId } from '../../src/libs/fingerprinting';


describe('Music fingerprinting functions', () => {
    test('getAcusticId', async () => {
        const musicPath = path.join(__dirname, '../resources/Under The Ice (Scene edit).mp3');
        expect(fs.existsSync(musicPath)).toBeTruthy();

        const result = await getAcusticId(musicPath);
        const { duration, fingerprint } = result;
        expect(duration).toEqual('128');
        // libchromaprint-tools has different version on the offical repo
        expect(
            fingerprint.endsWith('EFAI4AAQAExzhRpNMOCaGoCAAgIgA') || // Bionic
            fingerprint.endsWith('UGRigmqCAMCCsMAMAoEYBATAgE')       // Xenial
        ).toBeTruthy();
    });
});
