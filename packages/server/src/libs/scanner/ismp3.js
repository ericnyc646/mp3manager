const fileType = require('file-type');
const fs = require('fs');
const _ = require('underscore');

/**
* It checks if a file is an MP3
* @param  {Buffer|String}  param File's path or its Buffer representation
* @return {Boolean}       true if it's an MP3, false otherwise
*/
function isMp3(param) {
    let fileRes;
    try {
        if (Buffer.isBuffer(param)) {
            fileRes = fileType(param);
        } else if (!_.isEmpty(param) && _.isString(param)) {
            const buf = fs.readFileSync(param);
            fileRes = fileType(buf);
        }
    } catch (error) {
        console.error('isMp3 failed for ', param, error.message);
    }

    return !_.isEmpty(fileRes) && fileRes.ext === 'mp3';
}

module.exports = isMp3;
