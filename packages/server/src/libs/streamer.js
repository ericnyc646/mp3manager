import http from 'http';
import url from 'url';
import _ from 'underscore';
import fs from 'fs';
import config from '../config/getConfig';

export default function bootstrapStreamingServer() {
    return new Promise((resolve, reject) => {
        try {
            http.createServer((request, response) => {
                const queryData = url.parse(request.url, true).query;
                const skip = queryData.skip || 0;
                if (_.isEmpty(queryData.file)) {
                    response.writeHead(400, {
                        'Content-Type': 'application/json',
                    });
                    response.end({ error: 'Missing file parameter' });
                } else {
                    const filePath = 'TODO';
                    const stat = fs.statSync(filePath);
                    const startByte = stat.size * skip;

                    response.writeHead(200, {
                        'Content-Type': 'audio/mpeg',
                        'Content-Length': stat.size - startByte,
                    });

                    fs.createReadStream(filePath, { start: startByte }).pipe(response);
                }
            }).listen(config.backend.streamingPort, () => {
                console.info(`🎸 Streaming Server ready at http://localhost:${config.backend.streamingPort}`);
                resolve(true);
            });
        } catch (error) {
            console.error(error);
            reject(error);
        }
    });
}
