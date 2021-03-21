import React from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import * as firebase from 'firebase';


export default class Login extends React.Component {

  state = {
    email: '',
    password: '',
    login: true
  }

  constructor(props) {
    super(props);
  }

  handleEmailChange = (value) => {
    this.setState({email: value})
  }

  handlePasswordChange = (value) => {
    this.setState({password: value})
  }

  submitRegister = () => {
    firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password)
      .then((user) => {
        this.setState({login: true})
      });
   
  }

  submitLogin = () => {
    firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password)
    .then((res) => {
      this.props.navigation.navigate('Documents');
    }).catch((error) => {
      Alert(error);
    })
  }

  render(){
    return (
      <View style={this.styles.container}>
          <TextInput placeholder='Email' style={this.styles.customInputs} onChangeText={this.handleEmailChange} autoCapitalize="none"/>
          <TextInput placeholder='Password' style={this.styles.customInputs} onChangeText={this.handlePasswordChange} autoCapitalize="none"/>
          
          <TouchableOpacity onPress={this.state.login ? this.submitLogin : this.submitRegister}>
            <View style={this.styles.buttonContainer}> 
              {this.state.login ? <Text>Log In</Text> : <Text>Register</Text>}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => this.setState({login: false})} style={this.styles.footerContainer}>
            <Text>Register ?</Text>
          </TouchableOpacity>
      </View>
    )
  }

  styles = StyleSheet.create({
    container: {
      flex:1,
      justifyContent: 'center',
      alignItems: 'center'
    },

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
      width: 80,
      height: 20,
      borderWidth: 2,
      borderColor: 'grey',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 5
    },

    footerContainer: {
      marginTop: 100
    }
  })
}