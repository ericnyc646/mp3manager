# MP3 Manager

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Build Status](https://travis-ci.com/chrisvoo/mp3manager.svg?branch=master)](https://travis-ci.com/chrisvoo/mp3manager)

This project is intended to manage a large collection of MP3 files both from the browser and from a React Native app.
The interfaces should allow the user:

- to listen to music, streamed by a server in the same LAN as the client (Web and mobile client)
- to manage music files (delete them and edit their metatags)
- display lyrics

Extenal webservices API may be used, such as [MusicBrainz](https://musicbrainz.org/) or [Discogs](https://www.discogs.com/).

## Installation

This is a monorepo which hosts all the parts of the architecture. you can manage Node.js dependencies with [Lerna](https://lernajs.io/). To start modifying this project, just do the following after having cloned this repo:

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

This will launch all the components of the backend through [PM2](https://pm2.io/doc/en/runtime/overview/) and will allow you to view the standard output/error with `pm2 log server` command.