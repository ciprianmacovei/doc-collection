import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, TouchableHighlight } from 'react-native';
import { WebView } from 'react-native-webview';
import { AntDesign } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import * as firebase from 'firebase';


const storageRef = firebase.storage().refFromURL('gs://doc-collection-3ed14.appspot.com/');

export default class ListDocuments extends React.Component {

  state = {
    modalVisible: false,
    modalUrl: '',
    listOfFilesMetadata: []
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.getData();
  }


  getData = async () => {
    const arrayFilesRefs = await storageRef.listAll();
    const arrayFilesMeta = await Promise.all(arrayFilesRefs.items.map((ref) => ref.getMetadata()));
    this.setState({ listOfFilesMetadata: arrayFilesMeta });
  }

  deleteFile = (fileName) => {
    storageRef.child(fileName).delete()
      .then((res) => {
        if (res) Alert('File deleted');
      }, (error) => {
        if (error) Alert(error);
      });
  }

  previewFile = (fileName) => {
    storageRef.child(fileName).getDownloadURL()
      .then((res) => {
        if (res) {
          this.setState({ modalUrl: res });
          this.setState({ modalVisible: true });
        }
      }, (error) => {
        if (error) Alert(error);
      })
  }

  render() {
    const items = this.state.listOfFilesMetadata.map((item, index) => {
      return (
        <View style={this.styles.inputContainer} key={index}>

          <View style={this.styles.textPadding}>
            <Text>{item.name}</Text>
            <Text>{item.timeCreated}</Text>
            <Text>{item.size}</Text>
          </View>

          <View style={this.styles.editContainer}>

            <TouchableOpacity onPress={() => this.deleteFile(item.name)}>
              <AntDesign name="delete" size={24} color="black" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.previewFile(item.name)}>
              <MaterialIcons name="pageview" size={24} color="black" />
            </TouchableOpacity>

          </View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.modalVisible}
            onRequestClose={() => {
              Alert.alert('Modal has been closed.');
            }}>
            {/* <View style={this.styles.modalView}>
              <View style={this.styles.centeredView}> */}
            <WebView
              source={{ uri: this.state.modalUrl }}
              style={{ marginTop: 20 }}
            />
            {/* </View>
              </View> */}
            <TouchableHighlight
              style={{ ...this.styles.openButton, backgroundColor: 'grey' }}
              onPress={() => {
                this.setState({modalVisible: false});
              }}>
              <Text style={this.styles.textStyle}>Hide Modal</Text>
            </TouchableHighlight>
          </Modal>
        </View>
      );
    });

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <SafeAreaView>
          <ScrollView >
            {items.length ? items : <Text>Loading</Text>}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }


  styles = StyleSheet.create({

    fullView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    inputContainer: {
      flexDirection: 'row',
      borderWidth: 2,
      borderColor: 'grey',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 5
    },

    textPadding: {
      padding: 5
    },

    editContainer: {
      marginLeft: 10,
      marginRight: 10
    },

    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },

    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },

    modalView: {
      margin: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },

    openButton: {
      backgroundColor: '#F194FF',
      borderRadius: 20,
      padding: 10,
      elevation: 2,
    },

    textStyle: {
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
    },

  });

};


