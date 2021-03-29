import 'react-native-gesture-handler';
import React from 'react';
import { AppRegistry } from 'react-native';
import Router from './Routes/Router';

export default function App() {
  return (
      <Router/>
  );
}

AppRegistry.registerComponent('App', () => App)

