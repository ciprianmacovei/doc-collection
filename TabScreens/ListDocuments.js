import React from 'react';
import { View, Text } from 'react-native';
import * as firebase from 'firebase';


ListDocuments = () => {



var storageRef = firebase.storage().refFromURL('gs://doc-collection-3ed14.appspot.com/');
storageRef.listAll().then( res => {
  res.items.forEach((itemRef) => {
    // All the items under listRef.
    itemRef.getMetadata().then(res => {
      
    });
  });
});

return (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Settings!</Text>
  </View>
);
}
export default ListDocuments;