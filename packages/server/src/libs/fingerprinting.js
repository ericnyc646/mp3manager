import fpcalc from 'fpcalc';

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
