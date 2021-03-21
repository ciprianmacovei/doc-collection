import 'react-native-gesture-handler';
import React from 'react';
import Constants from 'expo-constants';
import Router from './Routes/Router';
import { AppRegistry } from 'react-native';

import * as firebase from 'firebase';

if (firebase.app.length) {
  firebase.initializeApp(Constants.manifest.extra.firebase);
}

export default function App() {
  return (
      <Router/>
  );
}

AppRegistry.registerComponent('App', () => App)

