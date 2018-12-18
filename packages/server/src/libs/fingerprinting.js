import fpcalc from 'fpcalc';

/**
 * It calculates an AcousticID fingerprint. Using different versions of the library, 
 * produces a different hash.
 * @param {String|Stream} obj it must be the path to an audio file or a readable stream.
If using a stream, note that you will not get duration out due to an fpcalc issue
 */
export function getAcusticId(obj) {
    return new Promise((resolve, reject) => {
        fpcalc(obj, (err, result) => {
            if (err) {
                return reject(err);
            }

            return resolve(result);
        });
    });
}

export class AcusticId {
    constructor(key) {
        this.key = key;
    }
}