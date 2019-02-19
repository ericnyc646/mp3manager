# MP3 Manager

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Build Status](https://travis-ci.com/chrisvoo/mp3manager.svg?branch=master)](https://travis-ci.com/chrisvoo/mp3manager)

__Table of contents__
- [Requirements](#requirements)
- [Installation](#installation)
- [Description and usage](#description-and-usage)
    * [Scanner](#scanner)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

This project is intended to manage a large collection of MP3 files both from the browser and from a React Native app. The browser version should do some privileged tasks like user management, absent from the mobile version which will focus more or listening to music.
The interfaces should allow the user:

- to listen to music, streamed by a server in the same LAN as the client (Web and mobile client)
- to manage music files (delete them and edit their metatags)
- display lyrics

Extenal webservices API may be used, such as [MusicBrainz](https://musicbrainz.org/) or [Discogs](https://www.discogs.com/). There are a couple of classes in the code which deals with their API, however due to the great amount of results they give, I've not found a way to use them to automatically edit music file. Probably this part could be done inside the browser, allowing the user to choose the appropriate result. 

## Requirements
- __Node.js 10.14.1+__: this is the LTS version I've used, but it should work with every version superior to 7.6, which supports `async/await` out of the box without requiring transpilation.
- __MariaDB 10.3.12__: this is the database explicitly used, but it should seamlessly work with MySQL too.
- __Redis__: at the moment it's just used by a task manager, Bull, used by the scanner

## Installation

This is a monorepo which hosts all the parts of the architecture. You can manage Node.js dependencies with [Lerna](https://lernajs.io/). To start modifying this project, just do the following after having cloned this repo:

```bash
npm install --global lerna
lerna bootstrap --hoist
```

If you want to add a module for all the projects, just do it with `lerna add <package>@<version> --hoist`.

## Description and usage

This project is composed by two main parts at the moment:

* API server: this endpoint provides the frontend with a set of GraphQL queries and mutations which can be executed by the frontend.
* Streaming server: this is responsible for serving your music collection files

To start these two components, just type the following commands:

```bash
npm install --global pm2
pm2 start <ROOT_PROJECT_DIR>/scripts/ecosystem.config.js
```

This will launch all the services through [PM2](https://pm2.io/doc/en/runtime/overview/) and will allow you to view the standard output/error with `pm2 log <package_name>` command.

### Scanner

This service is responsible for scanning a list of paths, seaching recursively for all the MP3 files it can find. To do that, it makes use of [Bull](https://github.com/OptimalBits/bull), a queue manager which runs automatically a job for every directory it finds in the trees of the specified paths. The more CPUs your machine has, the faster it is, because every job is a spawned process and jobs' references are stored inside Redis.

The database structure doesn't allow duplicates. The uniqueness is just given by the MD5 calculated for every file without considering its metadata (ID3). The MD5 is stored inside the ID3 Comment tag. This is the algorithm with pseudocode:

```
  for every file "f":
    - read comment metatag "c"
    if c has MD5 hash:
        if MD5(f) === c:
            - continue;
        else:
            - store MD5(f) in comment tag
            - read metadata "m"
            - UPDATE m inside the database
    else:
        - INSERT f inside the DB
        if the UNIQUE constraint fails:
            - INSERT f inside the table file_duplicates
```

In order to calculate the MD5 just on the data without considering the metadata, I use a C program called [mp3hash](https://github.com/sptim/mp3hash). This program is imported as a GIT submodule in this repo under the directory `external/mp3hash`. Do the following to obtain the executable:

```
cd external
git submodule init
git submodule update --remote
gcc -o mp3hash mp3hash.c md5/md5.c
```

If everything worked fine, you should see a `mp3hash` executable.
