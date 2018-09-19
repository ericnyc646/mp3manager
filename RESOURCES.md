
# Packages of interest:
## UTILS
 * https://github.com/SBoudrias/Inquirer.js#readme interactive CLI
 * https://github.com/ybootin/mp3gain.js#run-arguments

## Using Lerna
 * https://blog.risingstack.com/node-js-project-structure-tutorial-node-js-at-scale/ Validation

## METATAGS
 * https://github.com/aadsm/jsmediatags: (412) Media Tags Reader (ID3, MP4, FLAC)
 * https://www.npmjs.com/package/browser-id3-writer (37): writing ID3 (v2.3) tag to MP3 (no read)
 * https://www.npmjs.com/package/tagio (6) TagLib wrapper for Node.JS (https://taglib.org/: library for reading/editing the meta-data of several audio formats.)
 * https://www.npmjs.com/package/music-metadata (2,375) Stream and file based music metadata parser for node.
 * https://www.npmjs.com/package/ffmetadata: (622) Read and write media metadata using ffmpeg's metadata framework.
 * https://github.com/vankasteelj/mediainfo-wrapper
 * https://github.com/voltraco/node-taglib2
 * https://www.npmjs.com/package/node-id3 (1252) node-id3 is a ID3-Tag library written in JavaScript without other dependencies.
 * https://github.com/Borewit/music-metadata-browser#readme reader
 * https://github.com/gnavalesi/music-tag: D3 reader and writer for NodeJS

```javascript
 /* If the file doesn't have any metatags
      query a web service with the filename
    else
      estimate reliability between metatag and filename
      if value > positive %
        if misssing tags
          fill them from webservice
      else
        add to warn list */
```

## External Web services
### MusicBrainz
https://musicbrainz.org/: has MusicBrainz Picard which makes use of AcoustID (audio identification service)
 * https://www.npmjs.com/package/fpcalc
 * https://www.npmjs.com/package/musicbrainz: https://www.npmjs.com/search?q=musicbrainz
 * https://www.npmjs.com/package/graphbrainz (14)
 * https://www.npmjs.com/package/nodebrainz (330)

### DISCORG API
* https://www.discogs.com/developers/#page:home,header:home-quickstart
* https://www.npmjs.com/package/disconnect

## REPRODUCTION
 * https://github.com/goldfire/howler.js/tree/master/examples/player: reproducing audio files
 * https://www.npmjs.com/package/node-mp3-player: Use the browser Audio api
 * https://www.npmjs.com/package/speaker: (4,241) A Writable stream instance that accepts PCM audio data and outputs it to the speakers
 * https://www.npmjs.com/package/ion-sound: (167) JavaScript plugin for playing sounds on user actions and page events.
 * https://github.com/mixu/nplay: CLI mp3 player
 * https://github.com/scottschiller/SoundManager2 (4K) (HTML5 or Flash)
 * https://github.com/openplayerjs/openplayerjs#readme: HTML5 video/audio player with smooth controls and VAST/VPAID/VMAP capabilities
 * https://www.npmjs.com/package/audiosource: A simple utility to manage audio playback.
 * https://www.npmjs.com/package/web-audio-player

## CONVERSION / MODIFICATION
 * https://www.npmjs.com/package/ffmpeg-wrapper: flac to mp3
 * https://github.com/jankarres/node-lame mp3 <-> WAV
 * https://www.npmjs.com/package/audio-converter: (15) converting wave files to ogg/mp3
 * https://github.com/cevadtokatli/mp3-cutter#readme (3)
 * https://www.npmjs.com/package/trimp3 (1) trim" single mp3 files.

## WEB
 * https://github.com/chadpaulson/react-cassette-player HTML 5 audio player
 * http://johndyer.name/html5-audio-karoke-a-javascript-audio-text-aligner/
 * https://www.npmjs.com/package/react-tunes-player
 * https://github.com/cezarlz/react-cl-audio-player

## Mobile
 * https://github.com/futurice/react-native-audio-toolkit
