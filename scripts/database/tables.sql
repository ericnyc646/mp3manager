CREATE TABLE file (
    id SERIAL,
    name VARCHAR(50) NOT NULL,
    atime DATETIME COMMENT 'Access time',
    mtime DATETIME COMMENT 'Modification time',
    size INT COMMENT 'File size in bytes',
    path TEXT NOT NULL,
    md5_hash CHAR(32) COMMENT 'MD5 without including metadata',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY md5_hash_uq(md5_hash)
) ENGINE = InnoDB, COMMENT = 'Music files';


CREATE TABLE file_duplicated (
    id SERIAL,
    path VARCHAR(500) NOT NULL COMMENT 'VARCHAR needed to allow this field to be used in composite UNIQUE KEY',
    md5_hash CHAR(32) COMMENT 'MD5 without including metadata',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_dup(path, md5_hash)
) ENGINE = InnoDB, COMMENT = 'Duplicated music files';   


CREATE TABLE file_metadata (
    id SERIAL,
    md5_hash CHAR(32) COMMENT 'MD5 without including metadata',
    bitrate SMALLINT UNSIGNED COMMENT 'Expressd in Kbit',
    sample_rate SMALLINT UNSIGNED COMMENT 'Express in Hz',
    number_of_channels TINYINT UNSIGNED,
    codec_profile TEXT,
    comment JSON,
    encoder TEXT,
    duration SMALLINT UNSIGNED COMMENT 'Expressed in seconds',
    acoustid_id CHAR(36),
    album TEXT,
    artist TEXT,
    date DATE,
    genre JSON,
    isrc JSON COMMENT 'International Standard Recording Code',
    label JSON,
    language TEXT COMMENT 'Separated by comma',
    lyricist JSON,
    media TEXT,
    musicbrainz_workid CHAR(36),
    musicbrainz_albumid CHAR(36),
    musicbrainz_recordingid CHAR(36),
    musicbrainz_artistid JSON,
    musicbrainz_albumartistid JSON,
    musicbrainz_releasegroupid CHAR(36),
    musicbrainz_trackid CHAR(36),
    originaldate DATE,
    originalyear SMALLINT UNSIGNED,
    has_picture BOOLEAN,
    releasecountry CHAR(2),
    title TEXT,
    track TEXT,
    writer JSON,
    year SMALLINT UNSIGNED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY file_md5_fk(md5_hash) 
        REFERENCES file(md5_hash)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY md5_hash_meta_uq(md5_hash),
    CHECK (JSON_VALID(comment)),
    CHECK (JSON_VALID(genre)),
    CHECK (JSON_VALID(isrc)),
    CHECK (JSON_VALID(label)),
    CHECK (JSON_VALID(musicbrainz_artistid)),
    CHECK (JSON_VALID(musicbrainz_albumartistid)),
    CHECK (JSON_VALID(lyricist)),
    CHECK (JSON_VALID(writer))
) ENGINE = InnoDB, COMMENT = 'Metadata parsed by music-metadata';

CREATE TABLE band (
    id SERIAL,
    name VARCHAR(50) NOT NULL,
    genres JSON COMMENT 'Array of genres',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB, COMMENT = 'Music bands';


CREATE TABLE album (
    id SERIAL,
    name VARCHAR(50) NOT NULL,
    released DATETIME,
    studio VARCHAR(50),
    city VARCHAR(50),
    genres JSON COMMENT 'Array of genres',
    length SMALLINT UNSIGNED COMMENT 'Duration in seconds',
    band_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY band_id_fk(band_id) 
        REFERENCES band(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (JSON_VALID(genres))
) ENGINE = InnoDB, COMMENT = 'Music albums';


CREATE TABLE musician (
    id SERIAL,
    full_name VARCHAR(50) NOT NULL,
    birth_date DATETIME,
    death_date DATETIME COMMENT 'Still alive if NULL',
    instruments JSON COMMENT 'Array of instruments',
    activity_year_start SMALLINT UNSIGNED,
    activity_year_end SMALLINT UNSIGNED COMMENT 'Still active if NULL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE = InnoDB, COMMENT = 'Artists';


CREATE TABLE album_musician (
    musician_id BIGINT UNSIGNED NOT NULL,
    album_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (musician_id, album_id),
    FOREIGN KEY am_musician_id_fk(musician_id) 
        REFERENCES musician(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY am_album_id_fk(album_id) 
        REFERENCES album(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB, COMMENT = 'Performers of the albums';


CREATE TABLE track (
    id SERIAL,
    name VARCHAR(50) NOT NULL,
    bitrate SMALLINT UNSIGNED, 
    rating TINYINT,
    genre VARCHAR(50) COMMENT 'Particular genre for this track',
    album_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY track_album_id_fk(album_id) 
        REFERENCES album(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (rating >= 0 AND rating <= 5),
    CHECK (bitrate > 0 AND bitrate <= 320)
) ENGINE = InnoDB, COMMENT = 'Music tracks';


CREATE TABLE file_track (
    file_id BIGINT UNSIGNED NOT NULL,
    track_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modification_time DATETIME ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (file_id, track_id),
    FOREIGN KEY ft_track_id_fk(track_id) 
        REFERENCES track(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ft_file_id_fk(file_id) 
        REFERENCES file(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB, COMMENT = 'Relationship between music tracks and files';