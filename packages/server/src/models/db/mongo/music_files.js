const mongoose = require('mongoose');

const { Schema } = mongoose;
const modelName = 'MusicFiles';

const MusicFiles = new Schema({
    path: { type: String, required: true },
    audioHash: { type: String, required: true },
    fileSize: Number,
    metadata: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
});

module.exports = mongoose.model(modelName, MusicFiles, modelName);

/* 
C:\Users\User\Documents\GitHub\mp3manager>npm run scan

> experiments@1.0.0 scan C:\Users\User\Documents\GitHub\mp3manager
> cross-env NODE_ENV=production NODE_OPTIONS='--max-old-space-size=4096' node scripts/cli/mm scan D:\Musica

Scanning 1 resources in production mode
Trying to connect to  mongodb://localhost:27017/music_manager
Connected to mongo...

<--- Last few GCs --->

[16744:0000024DD9FA9F40]   141399 ms: Mark-sweep 63.2 (70.7) -> 63.2 (71.2) MB, 47.8 / 0.1 ms  (average mu = 0.165, current mu = 0.225) low memory notification GC in old space requested
[16744:0000024DD9FA9F40]   141438 ms: Mark-sweep 63.2 (71.2) -> 63.2 (71.2) MB, 38.9 / 0.1 ms  (average mu = 0.100, current mu = 0.001) low memory notification GC in old space requested


<--- JS stacktrace --->

==== JS stack trace =========================================

Security context: 0x02aaa229e6e9 <JSObject>
    0: builtin exit frame: new ArrayBuffer(aka ArrayBuffer)(this=0x027bb3502801 <the_hole>,0x0202be202569 <Number 8.19095e+06>,0x027bb3502801 <the_hole>)

    1: ConstructFrame [pc: 000002AF8F50D385]
    2: createUnsafeArrayBuffer(aka createUnsafeArrayBuffer) [00000080419526C9] [buffer.js:~115] [pc=000002AF8F8440B1](this=0x027bb35026f1 <undefined>,size=0x0202be202569 <Number 8.19095e+06>)
    3:...

FATAL ERROR: Committing semi space failed. Allocation failed - JavaScript heap out of memory
 1: 00007FF6E36FF04A
 2: 00007FF6E36DA0C6
 3: 00007FF6E36DAA30
 4: 00007FF6E39620EE
 5: 00007FF6E396201F
 6: 00007FF6E3E82BC4
 7: 00007FF6E3E79C5C
 8: 00007FF6E3E7829C
 9: 00007FF6E3E77765
10: 00007FF6E3989A91
11: 00007FF6E35F0E52
12: 00007FF6E3C7500F
13: 00007FF6E3BE55B4
14: 00007FF6E3BE5A5B
15: 00007FF6E3BE587B
16: 000002AF8F55C721
npm ERR! code ELIFECYCLE
npm ERR! errno 134
npm ERR! experiments@1.0.0 scan: `cross-env NODE_ENV=production NODE_OPTIONS='--max-old-space-size=4096' node scripts/cli/mm scan D:\Musica`
npm ERR! Exit status 134
npm ERR!
npm ERR! Failed at the experiments@1.0.0 scan script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     C:\Users\User\AppData\Roaming\npm-cache\_logs\2019-07-28T13_02_38_897Z-debug.log
*/
