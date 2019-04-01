const _ = require('underscore');
const mm = require('music-metadata');
const moment = require('moment');
const { getConnection } = require('../../libs/pool');
const DbModel = require('./DbModel');

class FileMetadata extends DbModel {
    static get TABLE_NAME() {
        return 'file_metadata';
    }

    static get FIELDS() {
        return [
            'md5_hash', 'bitrate', 'sample_rate', 'number_of_channels', 'codec_profile',
            'encoder', 'duration', 'acoustid_id', 'comment', 'album', 'artist', 'date',
            'genre', 'isrc', 'label', 'language', 'lyricist', 'media', 'musicbrainz_workid',
            'musicbrainz_albumid', 'musicbrainz_recordingid', 'musicbrainz_artistid',
            'musicbrainz_albumartistid', 'musicbrainz_releasegroupid', 'musicbrainz_trackid',
            'originaldate', 'originalyear', 'has_picture', 'releasecountry',
            'title', 'track', 'writer', 'year',
        ];
    }

    /**
     * Get a subset of all the metatags and file's info,
     * parsing it with `mm`
     * @param {string} filePath file's absolute path
     * @returns {Promise<Object>} the metatags found
     */
    static async getMetadata(filePath) {
        const metadata = await mm.parseFile(filePath, { duration: true });
        const { format, common } = metadata;
        const { sampleRate: sample_rate, numberOfChannels: number_of_channels,
            codecProfile: codec_profile, encoder, duration } = format;

        const bitrate = !_.isEmpty(format.bitrate) ? parseInt(format.bitrate / 1000, 10) : null;

        // placeholders' values cannot be undefined, so we set NULL as default value
        const { acoustid_id = null, comment = [], album = null, artist = null, date = null,
            genre = null, isrc = null, label = null, language = null, lyricist = null, media = null,
            musicbrainz_workid = null, musicbrainz_albumid = null, musicbrainz_recordingid = null,
            musicbrainz_artistid = null, musicbrainz_albumartistid = null,
            musicbrainz_releasegroupid = null, musicbrainz_trackid = null,
            originaldate = null, originalyear = null, picture = null, releasecountry = null,
            title = null, track = null, writer = null, year = null } = common;

        let theTrack = null;
        let theDate = null;

        if (!_.isEmpty(track)) {
            const { no, of } = track;
            if (!_.isEmpty(no)) {
                theTrack = !_.isEmpty(of) ? `${no}/${of}` : no;
            }
        }

        if (!_.isEmpty(date)) {
            const momDate = moment(date, ['YYYY-MM-DD', moment.ISO_8601]);
            if (momDate.isValid()) {
                theDate = momDate.format('YYYY-MM-DD');
            }
        }

        const has_picture = !_.isEmpty(picture);

        return {
            bitrate, sample_rate, number_of_channels, codec_profile, encoder,
            duration, acoustid_id, comment, album, artist, date: theDate,
            genre, isrc, label, language, lyricist, media, musicbrainz_workid,
            musicbrainz_albumid, musicbrainz_recordingid, musicbrainz_artistid,
            musicbrainz_albumartistid, musicbrainz_releasegroupid, musicbrainz_trackid,
            originaldate, originalyear, has_picture, releasecountry, title, track: theTrack,
            writer, year,
        };
    }

    /**
     * Insert a subset of all the metadata found for a file or
     * update them if the MD5 is already present in the table
     * @param {string} filePath file's absolute path
     * @param {string} md5hash file's MD5 without considering its metadata
     */
    static async upsert(filePath, md5hash) {
        const connection = await getConnection();

        const metadata = await this.getMetadata(filePath);
        metadata.md5_hash = md5hash;

        try {
            const result = await connection.query(
                {
                    namedPlaceholders: true,
                    sql: `INSERT INTO ${this.TABLE_NAME} (
                            ${this.getFields()}
                          ) VALUES (
                            ${this.getPlaceholders()}
                          ) ON DUPLICATE KEY UPDATE ${this.getValuesExpressions()};`,
                },
                metadata,
            );

            if (result.warningStatus !== 0) {
                await this.showWarnings(connection);
            }

            return result;
        } finally {
            connection.end();
        }
    }
}

module.exports = FileMetadata;
