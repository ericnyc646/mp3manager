# Notes about React Native

## Requirements

- Node 10+
- [Expo CLI](https://expo.io/)
- Expo app fro Android

## Installation

```bash
npm install -g expo-cli
expo init AwesomeProject
cd AwesomeProject
npm start # you can also use: expo start
```

I got some errors during the installation of Expo with sudo. See this [issue](https://github.com/expo/expo-cli/issues/412).

Install the Expo client app on your iOS or Android phone and connect to the same wireless network as your computer. On Android, use the Expo app to scan the QR code from your terminal to open your project.

## Features and caveats

**It's not possible to include custom native modules** beyond the React Native APIs and components that are available in the Expo client app.

If you know that you'll eventually need to include your own native code, Expo is still a good way to get started. In that case you'll just need to ["eject"](https://docs.expo.io/versions/latest/expokit/eject) eventually to create your own native builds.

React Native is like React, but it uses **native components instead of web components** as building blocks. 

## References

- [Expo docs](https://docs.expo.io/versions/latest/)
- [React Native Web Player](http://dabbott.github.io/react-native-web-player/): Build and run React Native apps in your browser!
