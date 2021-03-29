import React, { useState, useRef, useEffect } from 'react';
import Constants from 'expo-constants';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Platform, Button, Alert } from 'react-native';
import { storageRef } from '../../../firebase';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as DocumentPicker from 'expo-document-picker';

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: false,
		shouldSetBadge: false
	})
});

CreateDocument = () => {
	const [ formValid, setFormValidity ] = useState(false);
	const [ date, setDate ] = useState(new Date());
	const [ time, setTime ] = useState(new Date());
	const [ filename, setFilename ] = useState(null);
	const [ expoPushToken, setExpoPushToken ] = useState('');
	const [ notification, setNotification ] = useState(false);
	const notificationListener = useRef();
	const responseListener = useRef();

	useEffect(() => {
		registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

		notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
			setNotification(notification);
		});

		responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
			console.log(response.notification.request.content.data.data)
		});

		return () => {
			Notifications.removeNotificationSubscription(notificationListener);
			Notifications.removeNotificationSubscription(responseListener);
		};
	}, []);

	const onChangeDate = (event, selectedDate) => {
		const currentDate = new Date(selectedDate || date);
		const setDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
		setDateOnly.setHours(0, 0, 0);
		setDate(currentDate);
	};

	const onChangeTime = (event, selectedDate) => {
		const currentDate = selectedDate || time;
		setTime(currentDate);
	};

	const registerForPushNotificationsAsync = async () => {
		let token;
		if (Constants.isDevice) {
			const { status: existingStatus } = await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;
			if (existingStatus !== 'granted') {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}
			if (finalStatus !== 'granted') {
				alert('Failed to get push token for push notification!');
				return;
			}
			token = (await Notifications.getExpoPushTokenAsync()).data;
		} else {
			alert('Must use physical device for Push Notifications');
		}

		if (Platform.OS === 'android') {
			Notifications.setNotificationChannelAsync('default', {
				name: 'default',
				importance: Notifications.AndroidImportance.MAX,
				vibrationPattern: [ 0, 250, 250, 250 ],
				lightColor: '#FF231F7C'
			});
		}

		return token;
	};

	const pickDocument = async () => {
		let result = await DocumentPicker.getDocumentAsync({});
		if (result.type !== 'cancel') {
			const blob = await uriToBlob(result.uri);
			if (blob) {
				uploadToFirebase(blob).then(
					(res) => {
						if (res) {
							setFormValidity(true);
						}
					},
					(error) => {
						setFormValidity(false);
						Alert(error);
					}
				);
			} else {
				Alert('Upload error');
			}
		}
	};

	const uriToBlob = (uri) => {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.onload = function() {
				// return the blob
				resolve(xhr.response);
			};
			xhr.onerror = function() {
				// something went wrong
				reject(new Error('uriToBlob failed'));
			};
			// this helps us get a blob
			xhr.responseType = 'blob';
			xhr.open('GET', uri, true);
			xhr.send(null);
		});
	};

	const uploadToFirebase = (blob) => {
		return new Promise((resolve, reject) => {
			storageRef
				.child(`${filename}`)
				.put(blob, {
					contentType: 'application/pdf'
				})
				.then((snapshot) => {
					blob.close();
					resolve(snapshot);
				})
				.catch((error) => {
					reject(error);
				});
		});
	};

	const transformDateAndTimeToSeconds = () => {
		let selectedDateMilliseconds = new Date(date).getTime(),
			selectedTime = new Date(time),
			selectedTimeMilliseconds =
				(+selectedTime.getHours() * 60 * 60 + +selectedTime.getMinutes() * 60 + +selectedTime.getSeconds()) *
				1000;

		return (selectedDateMilliseconds + selectedTimeMilliseconds - new Date().getTime()) / 1000 - 45800;
	};

	const submitCreate = async () => {
		if (formValid) {
			const timeTillNotify = transformDateAndTimeToSeconds();
			await Notifications.scheduleNotificationAsync({
				content: {
					title: 'Notification! 📬',
					body: `File name ${filename} will expire today`,
					data: { data: filename }
				},
				trigger: { seconds: timeTillNotify }
			});
		}
	};

	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			<TextInput
				placeholder="Document Name"
				style={styles.customInputs}
				autoCapitalize="none"
				onChangeText={setFilename}
			/>
			{filename ? (
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
							<Button title="Select document" color="red" borderColor="red" onPress={pickDocument} />
						</View>
					</View>
					{formValid ? (
						<TouchableOpacity onPress={submitCreate}>
							<View style={styles.buttonContainer}>
								<Text>Create Document</Text>
							</View>
						</TouchableOpacity>
					) : null}
				</View>
			) : null}
		</View>
	);
};

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
});

export default CreateDocument;
