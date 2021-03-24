import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Platform, Button, Alert } from 'react-native';
import * as firebase from 'firebase';

import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';



CreateDocument = () => {
  const [formValid, setFormValidity] = useState(false);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [filename, setFilename] = useState(null);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
  };

  const onChangeTime = (event, selectedDate) => {
    const currentDate = selectedDate || time;
    setTime(currentDate);
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({});
    if (result.type !== 'cancel') {
      const blob = await uriToBlob(result.uri);
      if (blob) {
        uploadToFirebase(blob)
          .then((res) => {
            if (res) {
              setFormValidity(true);
            }
          }, (error) => {
            setFormValidity(false);
            Alert(error);
          })
      } else {
        Alert('Upload error');
      }
    }
  }

  const uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        // return the blob
        resolve(xhr.response);
      };
      xhr.onerror = function () {
        // something went wrong
        reject(new Error('uriToBlob failed'));
      };
      // this helps us get a blob
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

  }

  const uploadToFirebase = (blob) => {
    return new Promise((resolve, reject) => {
      var storageRef = firebase.storage().ref();
      storageRef.child(`${filename}`).put(blob, {
        contentType: 'application/pdf'
      }).then((snapshot) => {
        blob.close();
        resolve(snapshot);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  const submitCreate = () => {
    if (formValid) {
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TextInput placeholder='Document Name' style={styles.customInputs} autoCapitalize="none" onChangeText={setFilename} />
      { filename ?
        <View>
          <View style={styles.dateAndTime}>
            <View style={styles.marginTop}>
              <Text>Select date</Text>
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={onChangeDate}
              />
            </View>
            <View style={styles.marginTop}>
              <Text>Select time</Text>
              <DateTimePicker
                testID="dateTimePicker"
                value={time}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onChangeTime}
              />
            </View>
            <View style={styles.marginTop}>
              <Text>Pick File:</Text>
              <Button
                title="Select document"
                color="red"
                borderColor="red"
                onPress={pickDocument}
              />
            </View>
          </View>
          {formValid ?
            <TouchableOpacity onPress={submitCreate}>
              <View style={styles.buttonContainer}>
                <Text>Create Document</Text>
              </View>
            </TouchableOpacity> : null
          }
        </View> : null
      }
    </View>
  );
}


const styles = StyleSheet.create({

  dateAndTime: {
    flexDirection: 'column'
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
    width: 120,
    height: 20,
    borderWidth: 2,
    borderColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5
  },

  marginTop: {
    marginTop: 10
  }
})

export default CreateDocument;