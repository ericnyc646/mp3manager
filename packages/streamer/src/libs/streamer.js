const http = require('http');
const url = require('url');
const _ = require('underscore');
const fs = require('fs');
const config = require('../config/getConfig');
const logger = require('./logger');

/**
 * Bootraps the streaming server. This is just a stub which plays a file in this directory.
 * The `skip` parameter allows to skip `x` bytes from the beginning.
 */
function bootstrapStreamingServer() {
    return new Promise((resolve, reject) => {
        try {
            http.createServer((request, response) => {
                const queryData = url.parse(request.url, true).query;

                let skip = 0;
                
                if (queryData.skip) {
                    const parsed = parseInt(queryData.skip, 10);
                    if (_.isNumber(parsed)) {
                        skip = parsed;
                    }
                }

                logger.debug('Streamer', { file: queryData.file, skip });

                if (_.isEmpty(queryData.file)) {
                    response.writeHead(400, {
                        'Content-Type': 'application/json',
                    });
                    response.end(JSON.stringify({ error: 'Missing file parameter' }));
                } else {
                    const filePath = `${__dirname}/file.mp3`;
                    const stat = fs.statSync(filePath);
                    const startByte = skip;

                    response.writeHead(200, {
                        'Content-Type': 'audio/mpeg',
                        'Content-Length': stat.size - startByte,
                    });

                    fs.createReadStream(filePath, { start: startByte }).pipe(response);
                }
            }).listen(config.streamingPort, () => {
                console.info(`🎸 Streaming Server ready at http://localhost:${config.streamingPort}`);
                resolve(true);
            });
        } catch (error) {
            // just catches the bootstrap error, not the errors triggered by the requests
            console.error(error);
            reject(error);
        }
    });
}

module.exports = bootstrapStreamingServer;
