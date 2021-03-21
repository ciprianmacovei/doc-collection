import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as firebase from 'firebase';

const Tab = createBottomTabNavigator();

export default class Documents extends React.Component {

  createScreen = () => 
      (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <TextInput placeholder='Document Name' style={this.styles.customInputs} autoCapitalize="none"/>
        <TouchableOpacity >
          <View style={this.styles.buttonContainer}> 
            <Text>Create Document</Text>
          </View>
        </TouchableOpacity> 
      </View>
    );

  
  listScreen() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Settings!</Text>
      </View>
    );
  }

  render(){
    return (
       <Tab.Navigator>
        <Tab.Screen name="Create" component={this.createScreen} />
        <Tab.Screen name="List" component={this.listScreen} />
       </Tab.Navigator>
    )
  }

  styles = StyleSheet.create({
    customInputs: {
      width: 200,
      height: 30,
      borderColor: 'black',
      borderWidth: 2,
      marginTop: 4,
      borderRadius: 5
    },

    buttonContainer: {
      marginTop: 20,
      width: 120,
      height: 20,
      borderWidth: 2,
      borderColor: 'grey',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 5
    },
  })
}

