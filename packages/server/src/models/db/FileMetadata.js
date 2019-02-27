const _ = require('underscore');
const mm = require('music-metadata');
const { getConnection } = require('../../libs/pool');
const DbModel = require('./DbModel');

class FileMetadata extends DbModel {
    static get TABLE_NAME() {
        return 'file_metadata';
    }

    static get FIELDS() {
        return [
            'bitrate', 'sample_rate', 'number_of_channels', 'codec_profile',
            'encoder', 'duration', 'acoustid_id', 'comment', 'album', 'artist', 'date',
            'genre', 'isrc', 'label', 'language', 'lyricist', 'media', 'musicbrainz_workid',
            'musicbrainz_albumid', 'musicbrainz_recordingid', 'musicbrainz_artistid',
            'musicbrainz_albumartistid', 'musicbrainz_releasegroupid', 'musicbrainz_trackid',
            'originaldate', 'originalyear', 'has_picture', 'releasecountry',
            'title', 'track', 'writer', 'year',
        ];
    }

    /**
     * Insert a subset of all the metadata found for a file or
     * update them if the MD5 is already present in the table
     * @param {string} filePath file's absolute path
     * @param {string} md5hash file's MD5 without considering its metadata
     */
    static async upsert(filePath, md5hash) {
        const connection = await getConnection();

        if (_.isNull(connection)) {
            return {};
        }

        const metadata = await mm.parseFile(filePath, { duration: true });
        const { format, common } = metadata;
        const { bitrate, sampleRate, numberOfChannels,
            codecProfile, encoder, duration } = format;
        const { acoustid_id, comment, album, artist, date,
            genre, isrc, label, language, lyricist, media,
            musicbrainz_workid, musicbrainz_albumid, musicbrainz_recordingid,
            musicbrainz_artistid, musicbrainz_albumartistid,
            musicbrainz_releasegroupid, musicbrainz_trackid,
            originaldate, originalyear, has_picture, releasecountry,
            title, track, writer, year } = common;

        try {
            return connection.query(
                {
                    namedPlaceholders: true,
                    sql: `INSERT INTO ${FileMetadata.TABLE_NAME} (
                            ${FileMetadata.FIELDS.join(',')}
                          ) VALUES (
                            :bitrate, :sampleRate, :numberOfChannels, :codecProfile,
                            :encoder, :duration, :acoustid_id, :comment, :album, :artist, :date,
                            :genre, :isrc, :label, :language, :lyricist, :media, :musicbrainz_workid,
                            :musicbrainz_albumid, :musicbrainz_recordingid, :musicbrainz_artistid,
                            :musicbrainz_albumartistid, :musicbrainz_releasegroupid, :musicbrainz_trackid,
                            :originaldate, :originalyear, :has_picture, :releasecountry,
                            :title, :track, :writer, :year
                          ) ON DUPLICATE KEY UPDATE animal='Gorilla';`,
                },
                { name, atime, mtime, size, path, md5_hash },
            );
        } finally {
            connection.end();
        }
    }
}

module.exports = FileMetadata;
