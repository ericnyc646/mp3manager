### TODO list
- [x] Install Lerna and structure the project (2018-09-17)
- [x] configure PM2 (2018-09-18)
- [ ] Implement the server
  - [x] GraphQL server setup: `apollo-server`'s new version has some differences in its setup. [Playground](https://www.apollographql.com/docs/apollo-server/features/graphql-playground.html) is always available in development, and always disabled with `NODE_ENV=production` (2018-09-17);
  - [ ] Evaluate the main fingerprinting tools.
    - [ ] https://github.com/spotify/echoprint-codegen
    - [ ] AcoustID audio fingerprint: https://github.com/parshap/node-fpcalc (https://acoustid.org/)
  - [ ] Implement and test the music scanner
  - [ ] Evaluate Lyrics providers
    - [ ] https://developer.musixmatch.com/
  - [ ] Albums' covers providers
    - [ ] https://fanart.tv/get-an-api-key/
  - [ ] Metadata providers
    - [ ] https://www.discogs.com/developers/
    - [ ] https://www.last.fm/api/show/artist.search
 