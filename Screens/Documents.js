import React from "react";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CreateDocument from '../TabScreens/CreateDocument';
import ListDocuments from '../TabScreens/ListDocuments';

const Tab = createBottomTabNavigator();

export default class Documents extends React.Component {

  render() {
    return (
      <Tab.Navigator>
        <Tab.Screen name="Create" component={CreateDocument} />
        <Tab.Screen name="List" component={ListDocuments} />
      </Tab.Navigator>
    )
  }
}
