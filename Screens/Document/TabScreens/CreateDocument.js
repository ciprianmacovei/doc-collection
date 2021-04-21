import React from 'react';
import Constants from 'expo-constants';
import {
	View,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	Platform,
	Button,
	Alert,
	Image,
} from 'react-native';
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

export default class CreateDocument extends React.Component {

	state = {
		date: new Date(),
		formValid: false,
		blob: undefined,
		filename: undefined,
		expoPushToken: '',
		notification: false,
		notificationListener: null,
		responseListener: null,
		editMode: false,
		isAndroid: false,
	}

	componentDidMount() {
		const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
			setNotification(notification);
		});
		const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
			console.log(response.notification.request.content.data.data)
		});
		this.props.navigation.addListener('focus', this.catchEditFile);
		this.setPlatform();
		this.setState({ notificationListener, responseListener })
	}

	componentWillUnmount() {
		Notifications.removeNotificationSubscription(this.state.notificationListener);
		Notifications.removeNotificationSubscription(this.state.responseListener);
		this.props.navigation.removeListener('focus', this.catchEditFile);
	}

	setPlatform = () => {
		if (Platform.OS === 'android') {
			this.setState({isAndroid: true});
		} else {
			this.setState({isAndroid: false});
		}
	}

	catchEditFile = (item) => {
		if (this.props && this.props.route && this.props.route.params && this.props.route.params.document) {
			const currentDocument = { ...this.props.route?.params?.document };
			if (currentDocument && Object.keys(currentDocument).length) {
				this.setState({ editMode: true });
				this.setState({ filename: currentDocument.name })
				this.setState({ date: new Date(currentDocument.customMetadata?.notificationTime) });
			}
		}
	}

	backToLogin = () => {
		this.props.navigation.navigate('Login');
	}

	onChangeDate = (event, selectedDate) => {
		if (selectedDate) {
			const currentDate = new Date(selectedDate || date);
			this.setState({ date: currentDate });
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
				name: 'default',
				importance: Notifications.AndroidImportance.MAX,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: '#FF231F7C'
			});
		}

		return token;
	};

	pickDocument = async () => {
		let result = await DocumentPicker.getDocumentAsync({});
		if (result.type !== 'cancel') {
			const reqBlob = await this.uriToBlob(result.uri);
			if (reqBlob) {
				this.setState({ blob: reqBlob });
			} else {
				Alert.alert('Upload error');
			}
		}
	};

	uriToBlob = (uri) => {
		const self = this;
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.onload = function () {
				// return the blob
				// setFormValidity(true);
				self.setState({ formValid: true });
				resolve(xhr.response);
			};
			xhr.onerror = function () {
				// something went wrong
				// setFormValidity(false);
				self.setState({ formValid: false });
				reject(new Error('uriToBlob failed'));
			};
			// this helps us get a blob
			xhr.responseType = 'blob';
			xhr.open('GET', uri, true);
			xhr.send(null);
		});
	};

	uploadToFirebase = (blob) => {
		return new Promise((resolve, reject) => {
			storageRef
				.child(`${this.state.filename}`)
				.put(blob, {
					contentType: 'application/pdf',
					customMetadata: {
						notificationTime: this.state.date
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

		dateNow.setHours(dateNow.getHours() + 3)
		dateNow = dateNow / 1000;


		if (selectedDate > dateNow) {
			return selectedDate - dateNow;
		} else {
			Alert.alert('You have not selected a good date');
		}
	};

	submitCreate = async () => {
		if (!this.state.editMode) {
			if (this.state.formValid && this.state.blob) {
				const timeTillNotify = this.transformDateInSeconds();
				if (timeTillNotify) {
					await Notifications.scheduleNotificationAsync({
						content: {
							title: 'Notification! 📬',
							body: `File name ${this.state.filename} will expire today`,
							data: { data: this.state.filename }
						},
						trigger: { seconds: timeTillNotify }
					});

					await this.uploadToFirebase(this.state.blob)
						.then((res) => {
							if (res) {
								Alert.alert('Item Created');
							}
						}, (error) => {
							Alert.alert(error);
						});
				}
			}
		} else {
			const timeTillNotify = this.transformDateInSeconds();
			if (timeTillNotify) {
				await Notifications.scheduleNotificationAsync({
					content: {
						title: 'Notification! 📬',
						body: `File name ${this.state.filename} will expire today`,
						data: { data: this.state.filename }
					},
					trigger: { seconds: timeTillNotify }
				});

				if (!this.state.blob) {
					await storageRef.child(this.state.filename).getDownloadURL()
						.then((url) => {
							var xhr = new XMLHttpRequest();
							xhr.responseType = 'blob';
							xhr.onload = async (event) => {
								var blob = xhr.response;
								await storageRef.child(this.state.filename).delete();
								await this.uploadToFirebase(blob)
									.then((res) => {
										if (res) {
											Alert.alert('Item Saved');
										}
									}, (error) => {
										Alert.alert(error);
									});
							};
							xhr.open('GET', url);
							xhr.send();
						})
						.catch((error) => {
							Alert.alert(error);
						});
				} else {
					await this.uploadToFirebase(this.state.blob)
						.then((res) => {
							if (res) {
								Alert.alert('Item Created');
							}
						}, (error) => {
							Alert.alert(error);
						});
				}
			}
		}
	};

	render() {
		return (
			<View style={{ flex: 1 }}>
				<TouchableOpacity style={this.styles.backButton} onPress={this.backToLogin}>
					<Image source={require('../../../assets/back.png')}></Image>
				</TouchableOpacity>
				<View style={this.styles.createDocumentContainer}>
					{
						!this.state.editMode ?
							<Text style={this.styles.createPageDescription}>Add your documents</Text> :
							<Text style={this.styles.createPageDescription}>Edit your documents</Text>
					}
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
								{ this.state.isAndroid ?
									<DateTimePicker
										style={{ marginTop: 10 }}
										testID="dateTimePicker"
										value={this.state.date}
										mode="datetime"
										is24Hour={true}
										dateFormat="year day month"
										display="default"
										onChange={this.onChangeDate}/> :
										null
								}
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
				</View >
				{
					!this.state.editMode ?
						<View style={this.state.filename && this.state.blob ? this.styles.saveButtonContainer : this.styles.saveButtonDisabledContainer}>
							<TouchableOpacity onPress={this.submitCreate} disabled={!(this.state.filename && this.state.blob)}>
								<View style={this.styles.buttonContainer}>
									<Text style={{ color: 'white', fontSize: 20 }}>Save Document</Text>
								</View>
							</TouchableOpacity>
						</View> :
						<View style={this.styles.saveButtonContainer}>
							<TouchableOpacity onPress={this.submitCreate}>
								<View style={this.styles.buttonContainer}>
									<Text style={{ color: 'white', fontSize: 20 }}>Save Document</Text>
								</View>
							</TouchableOpacity>
						</View>
				}
			</View >
		);

	}

	styles = StyleSheet.create({

		createDocumentContainer: {
			flex: 1,
			justifyContent: 'flex-start',
			alignItems: 'flex-start',
			marginLeft: 20,
			marginTop: 20
		},

		backButton: {
			marginTop: 50,
			marginLeft: 20
		},

		createPageDescription: {
			fontWeight: '600',
			fontSize: 25,
			lineHeight: 33,
			color: '#2F262E',
		},

		dateAndTime: {
			flexDirection: 'column'
		},

		customInputs: {
			width: 260,
			height: 48,
			backgroundColor: '#EBEBEF',
			marginBottom: 30,
			borderRadius: 20,
			paddingLeft: 20,
			marginTop: 10
		},

		buttonContainer: {
			marginTop: 20,
			width: 319,
			height: 56,
			borderRadius: 14,
			backgroundColor: '#8A4C7D',
			justifyContent: 'center',
			alignItems: 'center',
		},

		marginTop: {
			marginTop: 20
		},

		documentNameInputContainer: {
			marginTop: 30
		},

		saveButtonContainer: {
			flex: 1,
			justifyContent: 'flex-end',
			alignItems: 'center',
			marginBottom: 30
		},

		saveButtonDisabledContainer: {
			flex: 1,
			justifyContent: 'flex-end',
			alignItems: 'center',
			marginBottom: 30,
			opacity: 0.2
		},

		pickButton: {
			marginTop: 10,
			width: 180,
			height: 40,
			borderRadius: 8,
			backgroundColor: '#8A4C7D',
			justifyContent: 'center',
			alignItems: 'center',
			flexDirection: 'row'
		}

	});
}
