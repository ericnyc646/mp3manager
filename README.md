# MP3 Manager

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![Build Status](https://travis-ci.com/chrisvoo/mp3manager.svg?branch=master)](https://travis-ci.com/chrisvoo/mp3manager)

This project is intended to manage a large collection of MP3 files both from the browser and from a React Native app.
The interfaces should allow the user:

- to listen to music, streamed by a server in the same LAN as the client
- to manage music files (delete them and edit their metatags)
- display lyrics

Extenal webservices API may be used, such as [MusicBrainz](https://musicbrainz.org/) or [Discogs](https://www.discogs.com/).

## Installation

This is a monorepo which hosts all the parts of the architecture. you can manage Node.js dependencies with [Lerna](https://lernajs.io/). To start modifying this project, just do the following after having cloned this repo:

```bash
npm install --global lerna
lerna bootstrap --hoist
```

If you want to add a module for all the projects, just do it with `lerna add <package>@<version> --hoist`. For further information, take a look at the following articles:

- [Monorepos by example: Part 1](https://codeburst.io/monorepos-by-example-part-1-3a883b49047e)
- [Building large scale react applications in a monorepo](https://medium.com/@luisvieira_gmr/building-large-scale-react-applications-in-a-monorepo-91cd4637c131)
- [One vs. many — Why we moved from multiple git repos to a monorepo and how we set it up](https://hackernoon.com/one-vs-many-why-we-moved-from-multiple-git-repos-to-a-monorepo-and-how-we-set-it-up-f4abb0cfe469)
