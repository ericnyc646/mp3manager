const bootstrapStreamingServer = require('./libs/streamer');

console.time('boostrap');
bootstrapStreamingServer()
    .then(() => console.timeEnd('boostrap'))
    .catch((e) => console.error(e));
