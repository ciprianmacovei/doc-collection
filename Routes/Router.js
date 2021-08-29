import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Login from '../Screens/Login/Login.js'
import Documents from '../Screens/Document/Documents';

const Stack = createStackNavigator();

export default function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {/* <Stack.Screen name="Login" component={Login} /> */}
        <Stack.Screen name="Documents" component={Documents} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
