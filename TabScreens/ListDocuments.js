import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as firebase from 'firebase';

let once = true;

ListDocuments = () => {
	const storageRef = firebase.storage().refFromURL('gs://doc-collection-3ed14.appspot.com/');
	const [ listOfFilesMetadata, changeListOfFilesMetadata ] = useState([]);

	useEffect(() => {
		const getData = async () => {
      if (once) {
			const arrayFilesRefs = await storageRef.listAll();
			const arrayFilesMeta = await Promise.all(arrayFilesRefs.items.map((ref) => ref.getMetadata()));
      changeListOfFilesMetadata(arrayFilesMeta);
      once = false;
      }
		};
		getData();
	});

	const items = listOfFilesMetadata.map((item, index) => {
		return (
			<View style={styles.inputContainer} key={index}>
				<Text>{item.name}</Text>
				<Text>{item.timeCreated}</Text>
				<Text>{item.size}</Text>
			</View>
		);
	});

  console.log(listOfFilesMetadata);

	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			{ items.length ? items : <Text>Loading</Text> }
		</View>
	);
};

const styles = StyleSheet.create({
	inputContainer: {
		flexDirection: 'row',
		borderWidth: 2,
		borderColor: 'grey',
		justifyContent: 'center',
		alignItems: 'center'
	}
});

export default ListDocuments;
