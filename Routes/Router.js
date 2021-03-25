import React from 'react'
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Login from '../Screens/Login.js'
import Documents from '../Screens/Documents';

const Stack = createStackNavigator();

export default function Routes() {
return (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Login" component={Login} options={{ title: 'Login' }} />
      <Stack.Screen name="Documents" component={Documents} options={{ title: 'Documents' }}/>
    </Stack.Navigator>
  </NavigationContainer>
)
}
