import React from 'react';
import Constants from 'expo-constants';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Platform, Alert, Image, Keyboard } from 'react-native';
import { storageRef } from '../../../firebase';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as DocumentPicker from 'expo-document-picker';
import Spinner from 'react-native-loading-spinner-overlay';

Notifications.setNotificationHandler({
	handleNotification : async () => ({
		shouldShowAlert : true,
		shouldPlaySound : false,
		shouldSetBadge  : false
	})
});

export default class CreateDocument extends React.Component {
	state = {
		date                    : new Date(),
		formValid               : false,
		blobPdf                 : undefined,
		blob                    : undefined,
		filename                : undefined,
		expoPushToken           : '',
		notification            : false,
		notificationListener    : null,
		responseListener        : null,
		keyboardDidShowListener : null,
		keyboardDidHideListener : null,
		keyboardOn              : false,
		editMode                : false,
		isAndroid               : false,
		showDateTimeOnAndroid   : false,
		androidTime             : '',
		androidDate             : '',
		showLoading             : false,
		editFileName            : '',
		editFileType            : undefined
	};

	componentDidMount() {
		const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
			setNotification(notification);
		});
		const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
			console.log(response.notification.request.content.data.data);
		});
		const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
			this.setState({ keyboardOn: true })
		);
		const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
			this.setState({ keyboardOn: false })
		);
		this.setState({ notificationListener, responseListener, keyboardDidShowListener, keyboardDidHideListener });
		this.props.navigation.addListener('focus', this.catchEditFile);
		this.setPlatform();
	}

	componentWillUnmount() {
		if (this.state.notificationListener) {
			Notifications.removeNotificationSubscription(this.state.notificationListener);
		}
		if (this.state.responseListener) {
			Notifications.removeNotificationSubscription(this.state.responseListener);
		}
		if (this.state.keyboardDidShowListener) {
			this.state.keyboardDidShowListener.remove();
		}
		if (this.state.keyboardDidHideListener) {
			this.state.keyboardDidHideListener.remove();
		}
		this.props.navigation.removeListener('focus', this.catchEditFile);
	}

	setPlatform = () => {
		if (Platform.OS === 'android') {
			this.setState({ isAndroid: true });
		} else {
			this.setState({ isAndroid: false });
		}
	};

	catchEditFile = (item) => {
		if (this.props && this.props.route && this.props.route.params && this.props.route.params.document) {
			const currentDocument = { ...this.props.route.params.document };
			if (currentDocument && Object.keys(currentDocument).length) {
				console.log(currentDocument, '@@@@')
				this.setState({ editMode: true });
				this.setState({ editFileName: currentDocument.name });
				this.setState({ filename: currentDocument.name });
				this.setState({ editFileType: currentDocument.contentType });
				this.setState({ date: new Date(currentDocument.customMetadata.notificationTime) });
			}
			this.props.route.params.document = null;
		} else {
			this.setState({ editMode: false });
			this.setState({ editFileType: undefined});
			this.setState({ filename: '' });
			this.setState({ date: new Date() });
		}
	};

	showAndroidTimePicker = () => {
		this.setState({ showDateTimeOnAndroid: !this.state.showDateTimeOnAndroid });
	};

	backToLogin = () => {
		this.props.navigation.navigate('Login');
	};

	onChangeDate = (event, selectedDate) => {
		if (selectedDate) {
			const currentDate = new Date(selectedDate || date);
			this.setState({ date: currentDate });
		}
	};

	onChangeDateAndroid = (event, selectedDate) => {
		if (selectedDate) {
			this.setState({ showDateTimeOnAndroid: false });
			this.setState({ androidDate: selectedDate.toISOString().split('T')[0] });
			const concatenatedDateForAndroid = this.state.androidDate + 'T' + this.state.androidTime;
			console.log(concatenatedDateForAndroid, 'concatenated');
			this.setState({ date: new Date(concatenatedDateForAndroid) });
			console.log(this.state.androidDate, 'date', selectedDate.toISOString());
		}
	};

	onChangeTimeAndroid = (event, selectedDate) => {
		if (selectedDate) {
			this.setState({ androidTime: selectedDate.toISOString().split('T')[1] });
			console.log(this.state.androidTime, 'time', selectedDate.toISOString(), selectedDate);
		}
	};

	registerForPushNotificationsAsync = async () => {
		let token;
		if (Constants.isDevice) {
			const { status: existingStatus } = await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;
			if (existingStatus !== 'granted') {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}
			if (finalStatus !== 'granted') {
				Alert.alert('Failed to get push token for push notification!');
				return;
			}
			token = (await Notifications.getExpoPushTokenAsync()).data;
		} else {
			Alert.alert('Must use physical device for Push Notifications');
		}

		if (Platform.OS === 'android') {
			Notifications.setNotificationChannelAsync('default', {
				name             : 'default',
				importance       : Notifications.AndroidImportance.MAX,
				vibrationPattern : [ 0, 250, 250, 250 ],
				lightColor       : '#FF231F7C'
			});
		}

		return token;
	};

	pickDocument = async () => {
		try {
			let result = await DocumentPicker.getDocumentAsync({});
			if (result.type !== 'cancel') {
				let reqBlob;
				if (result.uri.indexOf('.pdf') > -1) {
					reqBlob = await this.uriToBlob(result.uri);
					if (reqBlob) {
						this.setState({ blobPdf: reqBlob });
						console.log('pdf');
					}
				} else {
					reqBlob = await this.uriToBlob(result.uri);
					if (reqBlob) {
						this.setState({ blob: reqBlob });
						console.log('img');
					}
				}
			} else {
				Alert.alert('Upload error');
			}
		} catch (e) {
			console.log(e);
		}
	};

	uriToBlob = (uri) => {
		const self = this;
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.onload = function() {
				self.setState({ formValid: true });
				resolve(xhr.response);
			};
			xhr.onerror = function() {
				self.setState({ formValid: false });
				reject(new Error('uriToBlob failed'));
			};
			// this helps us get a blob
			xhr.responseType = 'blob';
			xhr.open('GET', uri, true);
			xhr.send(null);
		});
	};

	uploadToFirebase = () => {
		return new Promise((resolve, reject) => {
			let contentType, blob;

			if (this.state.blobPdf) {
				blob = this.state.blobPdf;
				contentType = 'application/pdf';
			} else if (this.state.blob) {
				blob = this.state.blob;
				contentType = 'image/jpeg';
			} else {
				Alert.alert('Unknown uploaded type');
			}

			storageRef
				.child(this.state.filename)
				.put(blob, {
					contentType    : contentType,
					customMetadata : {
						notificationTime : this.state.date
					}
				})
				.then((snapshot) => {
					blob.close();
					resolve(snapshot);
				})
				.catch((error) => {
					throw error;
				});
		});
	};

	transformDateInSeconds = () => {
		let selectedDate = new Date(this.state.date),
			dateNow = new Date();

		selectedDate.setHours(selectedDate.getHours() + 3);
		selectedDate = selectedDate / 1000;

		dateNow.setHours(dateNow.getHours() + 3);
		dateNow = dateNow / 1000;

		if (selectedDate > dateNow) {
			return selectedDate - dateNow;
		} else {
			Alert.alert('You have not selected a good date');
			return false;
		}
	};

	submitCreate = async () => {
		this.setState({ showLoading: true });
		const timeTillNotify = this.transformDateInSeconds();
		if (!this.state.editMode) {
			if (timeTillNotify && this.state.formValid) {
				Notifications.scheduleNotificationAsync({
					content : {
						title : 'Notification! 📬',
						body  : `File name ${this.state.filename} will expire today`,
						data  : { data: this.state.filename }
					},
					trigger : { seconds: timeTillNotify }
				});

				this.uploadToFirebase().then(
					(res) => {
						if (res) {
							this.setState({ showLoading: false });
							Alert.alert('Item Created');
						}
					},
					(error) => {
						Alert.alert(error);
					}
				);
			} else {
				this.setState({ showLoading: false });
			}
		} else {
			if (timeTillNotify) {
				Notifications.scheduleNotificationAsync({
					content : {
						title : 'Notification! 📬',
						body  : `File name ${this.state.filename} will expire today`,
						data  : { data: this.state.filename }
					},
					trigger : { seconds: timeTillNotify }
				});

				const url = await storageRef.child(this.state.editFileName).getDownloadURL();

				if (!(this.state.blobPdf || this.state.blob)) {
					const blob = await this.uriToBlob(url);
					if (this.state.editFileType == 'image/jpeg') {
						this.setState({ blob: blob });
					} else if (this.state.editFileType == 'application/pdf') {
						this.setState({ blobPdf: blob });
					}
				}

				await storageRef.child(this.state.editFileName).delete();

				this.uploadToFirebase().then(
					(res) => {
						if (res) {
							this.setState({ showLoading: false });
						}
					},
					(error) => {
						Alert.alert(error);
					}
				);
			} else {
				this.setState({ showLoading: false });
			}
		}
	};

	render() {
		return (
			<View style={{ flex: 1 }}>
				<TouchableOpacity style={this.styles.backButton} onPress={this.backToLogin}>
					<Image source={require('../../../assets/back.png')} />
				</TouchableOpacity>
				<View style={this.styles.createDocumentContainer}>
					{!this.state.editMode ? (
						<Text style={this.styles.createPageDescription}>Add your documents</Text>
					) : (
						<Text style={this.styles.createPageDescription}>Edit your documents</Text>
					)}
					<View style={this.styles.documentNameInputContainer}>
						<Text>Document name</Text>
						<TextInput
							value={this.state.filename}
							placeholder="Document Name"
							style={this.styles.customInputs}
							autoCapitalize="none"
							onChangeText={(value) => this.setState({ filename: value })}
						/>
					</View>
					<View>
						<View style={this.styles.dateAndTime}>
							<View>
								<Text>Select date/time notification</Text>
								{!this.state.isAndroid ? (
									<DateTimePicker
										style={{ marginTop: 10 }}
										testID="dateTimePickerIOS"
										value={this.state.date}
										mode="datetime"
										is24Hour={true}
										dateFormat="year day month"
										display="default"
										onChange={this.onChangeDate}
									/>
								) : (
									<TouchableOpacity onPress={this.showAndroidTimePicker}>
										<View style={this.styles.selectAndroidDateButton}>
											<Text style={{ color: 'white' }}>Select date</Text>
										</View>
									</TouchableOpacity>
								)}
								{this.state.showDateTimeOnAndroid ? (
									<View>
										<DateTimePicker
											style={{ marginTop: 10 }}
											testID="dateTimePickerANDROID"
											value={this.state.date}
											mode="date"
											is24Hour={true}
											dateFormat="year day month"
											display="default"
											onChange={this.onChangeDateAndroid}
											on
										/>
										<DateTimePicker
											style={{ marginTop: 10 }}
											testID="dateTimePickerANDROID"
											value={this.state.date}
											mode="time"
											is24Hour={true}
											dateFormat="year day month"
											display="default"
											onChange={this.onChangeTimeAndroid}
										/>
									</View>
								) : null}
							</View>
							<View style={this.styles.marginTop}>
								<Text>Pick File:</Text>
								<TouchableOpacity onPress={this.pickDocument}>
									<View style={this.styles.pickButton}>
										<Text style={{ color: 'white', fontSize: 15 }}>Select document</Text>
										<Image style={{ marginLeft: 10 }} source={require('../../../assets/add.png')} />
									</View>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</View>
				{this.state.keyboardOn ? null : (
					<View style={{ flex: 1 }}>
						{!this.state.editMode ? (
							<View
								style={
									this.state.filename && (this.state.blob || this.state.blobPdf) ? (
										this.styles.saveButtonContainer
									) : (
										this.styles.saveButtonDisabledContainer
									)
								}
							>
								<TouchableOpacity
									onPress={this.submitCreate}
									disabled={!(this.state.filename && (this.state.blob || this.state.blobPdf))}
								>
									<View style={this.styles.buttonContainer}>
										<Text style={{ color: 'white', fontSize: 20 }}>Save Document</Text>
									</View>
								</TouchableOpacity>
							</View>
						) : (
							<View style={this.styles.saveButtonContainer}>
								<TouchableOpacity onPress={this.submitCreate}>
									<View style={this.styles.buttonContainer}>
										<Text style={{ color: 'white', fontSize: 20 }}>Save Document</Text>
									</View>
								</TouchableOpacity>
							</View>
						)}
					</View>
				)}
				<Spinner
					visible={this.state.showLoading}
					textContent={'Adding file...'}
					textStyle={{ color: '#8A4C7D' }}
				/>
			</View>
		);
	}

	styles = StyleSheet.create({
		createDocumentContainer     : {
			flex           : 1,
			justifyContent : 'flex-start',
			alignItems     : 'flex-start',
			marginLeft     : 20,
			marginTop      : 20
		},

		backButton                  : {
			marginTop  : 50,
			marginLeft : 20
		},

		createPageDescription       : {
			fontWeight : '600',
			fontSize   : 25,
			lineHeight : 33,
			color      : '#2F262E'
		},

		dateAndTime                 : {
			flexDirection : 'column'
		},

		customInputs                : {
			width           : 260,
			height          : 48,
			backgroundColor : '#EBEBEF',
			marginBottom    : 30,
			borderRadius    : 20,
			paddingLeft     : 20,
			marginTop       : 10
		},

		buttonContainer             : {
			marginTop       : 20,
			width           : 319,
			height          : 56,
			borderRadius    : 14,
			backgroundColor : '#8A4C7D',
			justifyContent  : 'center',
			alignItems      : 'center'
		},

		marginTop                   : {
			marginTop : 20
		},

		documentNameInputContainer  : {
			marginTop : 30
		},

		saveButtonContainer         : {
			flex           : 1,
			justifyContent : 'flex-end',
			alignItems     : 'center',
			marginBottom   : 30
		},

		saveButtonDisabledContainer : {
			flex           : 1,
			justifyContent : 'flex-end',
			alignItems     : 'center',
			marginBottom   : 30,
			opacity        : 0.2
		},

		pickButton                  : {
			marginTop       : 10,
			width           : 180,
			height          : 40,
			borderRadius    : 8,
			backgroundColor : '#8A4C7D',
			justifyContent  : 'center',
			alignItems      : 'center',
			flexDirection   : 'row'
		},

		selectAndroidDateButton     : {
			backgroundColor : '#8A4C7D',
			justifyContent  : 'center',
			alignItems      : 'center',
			width           : 120,
			height          : 25,
			borderRadius    : 5,
			marginTop       : 5
		}
	});
}
