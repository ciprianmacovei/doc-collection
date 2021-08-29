import React from 'react';
import Constants from 'expo-constants';
import {
	View,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	Platform,
	Alert,
	Image,
	Keyboard,
	ScrollView
} from 'react-native';
import { storageRef } from '../../../firebase';
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
		notificationDateAndTime : undefined,
		startContract           : undefined,
		endContract             : undefined,
		formValid               : false,
		blobPdf                 : undefined,
		blob                    : undefined,
		filename                : undefined,
		editedFilename          : undefined,
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
		editFileType            : undefined
	};

	componentDidMount() {
		const self = this;
		const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
			// setNotification(notification);
		});
		const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
			// AICI tr sa faci callbackul sa te duca direct pe fisierul care expira.
			// console.log(response.notification.request.content.data.data);
			self.props.navigation.jumpTo('List', {document: response.notification.request.content.data.data});
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
				let startContract = currentDocument.customMetadata.dataContract.split('-')[0].trim();
				let endContract = currentDocument.customMetadata.dataContract.split('-')[1].trim();
				this.setState({ editMode: true });
				this.setState({ filename: currentDocument.name });
				this.setState({ editedFilename: currentDocument.name });
				this.setState({ editFileType: currentDocument.contentType });
				this.setState({ startContract });
				this.setState({ endContract });
				this.setState({ notificationDateAndTime: currentDocument.customMetadata.notificationDateAndTime})
			}
			this.props.route.params.document = null;
		} else {
			this.setState({ editMode: false });
			this.setState({ editFileType: undefined });
			this.setState({ filename: '' });
			this.setState({ date: new Date() });
			this.setState({ startContract: undefined });
			this.setState({ endContract: undefined });
			this.setState({ notificationDateAndTime: undefined });
		}
	};

	backToLogin = () => {
		this.props.navigation.navigate('Login');
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
				Alert.alert('Nu ati selectat niciun document!');
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
						dataContract : `${this.state.startContract} - ${this.state.endContract}`,
						notificationDateAndTime: `${this.state.notificationDateAndTime}`
					}
				})
				.then((snapshot) => {
					this.setState({});
					resolve(snapshot);
				})
				.catch((error) => {
					throw error;
				});
		});
	};

	dateNotificationValidator = (value) => {
		if (value !== undefined && (new Date(value).toString() === 'Invalid Date' || value.length != 16)) {
			return false;
		}
		if (value !== undefined && !(Number(new Date(value).getTime()) > Number(new Date().getTime()))) {
			return false;
		}
		return true;
	};

	dateContractValidator = (value) => {
		if (value !== undefined && (new Date(value).toString() === 'Invalid Date' || value.length != 10)) {
			return false;
		}
		return true;
	};

	validateAll = (editMode) => {
		if (!editMode) {
			return (
				this.state.filename &&
				(this.state.blob || this.state.blobPdf) &&
				this.state.endContract &&
				this.dateContractValidator(this.state.endContract) &&
				this.state.startContract &&
				this.dateContractValidator(this.state.startContract) &&
				this.state.notificationDateAndTime &&
				this.dateNotificationValidator(this.state.notificationDateAndTime)
			);
		}

		return (
			this.state.filename &&
			this.state.endContract &&
			this.dateContractValidator(this.state.endContract) &&
			this.state.startContract &&
			this.dateContractValidator(this.state.startContract) &&
			this.state.notificationDateAndTime &&
			this.dateNotificationValidator(this.state.notificationDateAndTime)
		);
	};

	transformDateInSeconds = () => {
		let selectedDate = new Date(this.state.notificationDateAndTime.toString()),
			dateNow = new Date();

		selectedDate = Math.floor(selectedDate.getTime() / 1000);
		dateNow = Math.floor(dateNow.getTime() / 1000);

		if (selectedDate > dateNow) {
			return selectedDate - dateNow;
		} else {
			Alert.alert('Data care ati introdus o este in trecut!');
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
						title : 'Notificare!',
						body  : `Documentul ${this.state.filename} va expira in curand (Incepere Contract ${this.state
							.startContract} Sfarsit Contract ${this.state.endContract})`,
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
						Alert.alert('Error', error.message);
						this.setState({ showLoading: false });
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
						body  : `Documentul ${this.state.filename} va expira in curand (Incepere Contract ${this.state
							.startContract} Sfarsit Contract ${this.state.endContract})`,
						data  : { data: this.state.filename }
					},
					trigger : { seconds: timeTillNotify }
				});

				const url = await storageRef.child(this.state.editedFilename).getDownloadURL();

				if (!(this.state.blobPdf || this.state.blob)) {
					const blob = await this.uriToBlob(url);
					if (this.state.editFileType == 'image/jpeg') {
						this.setState({ blob: blob });
					} else if (this.state.editFileType == 'application/pdf') {
						this.setState({ blobPdf: blob });
					}
				}

				storageRef.child(this.state.editedFilename).delete();

				this.uploadToFirebase().then(
					(res) => {
						if (res) {
							if (res) {
								this.setState({ showLoading: false });
							}
						}
					},
					(error) => {
						Alert.alert('Error', error.message);
						this.setState({ showLoading: false });
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
				<ScrollView>
					<View style={this.styles.createDocumentContainer}>
						{!this.state.editMode ? (
							<Text style={this.styles.createPageDescription}>Adauga documentul tau</Text>
						) : (
							<Text style={this.styles.createPageDescription}>Editeaza documentul</Text>
						)}
						<View style={this.styles.documentNameInputContainer}>
							<Text style={this.styles.infoTextStyle}>Nume document</Text>
							<TextInput
								value={this.state.filename}
								onChangeText={(value) => this.setState({ filename: value })}
								placeholder="Nume document"
								style={this.styles.customInputs}
								autoCapitalize="none"
							/>
						</View>
						<View>
							<View style={this.styles.dateAndTime}>
								<View>
									<Text style={this.styles.infoTextStyle}>
										Seteaza data si ora la care vreti sa apara notificarea
									</Text>
									<TextInput
										value={this.state.notificationDateAndTime}
										onChangeText={(value) => this.setState({ notificationDateAndTime: value })}
										style={
											this.dateNotificationValidator(this.state.notificationDateAndTime) ? (
												this.styles.customInputs
											) : (
												this.styles.customInputsDanger
											)
										}
										autoCapitalize="none"
										placeholder="Data de forma: luna/zi/an ora:minut"
									/>
									{!this.dateNotificationValidator(this.state.notificationDateAndTime) ? (
										<Text style={this.styles.textDanger}>Data inserata este invalida</Text>
									) : null}
								</View>
								<View style={this.styles.marginBottom}>
									<Text style={this.styles.infoTextStyle}>Alege documentul din telefon</Text>
									<TouchableOpacity onPress={this.pickDocument}>
										<View style={this.styles.pickButton}>
											<Text style={{ color: 'white', fontSize: 13 }}>Selecteaza document</Text>
											<Image
												style={{ marginLeft: 10 }}
												source={require('../../../assets/add.png')}
											/>
										</View>
									</TouchableOpacity>
								</View>
								<View>
									<View>
										<Text style={this.styles.infoTextStyle}>Incepere Contract: luna/zi/an</Text>
										<TextInput
											value={this.state.startContract}
											onChangeText={(value) => this.setState({ startContract: value })}
											style={
												this.dateContractValidator(this.state.startContract) ? (
													this.styles.customInputs
												) : (
													this.styles.customInputsDanger
												)
											}
											autoCapitalize="none"
											placeholder="Data de forma: luna/zi/an"
										/>
										{!this.dateContractValidator(this.state.startContract) ? (
											<Text style={this.styles.textDanger}>Data inserata este invalida</Text>
										) : null}
									</View>
									<View>
										<Text style={this.styles.infoTextStyle}>Incetare Contract: luna/zi/an</Text>
										<TextInput
											value={this.state.endContract}
											onChangeText={(value) => this.setState({ endContract: value })}
											style={
												this.dateContractValidator(this.state.endContract) ? (
													this.styles.customInputs
												) : (
													this.styles.customInputsDanger
												)
											}
											autoCapitalize="none"
											placeholder="Data de forma: luna/zi/an"
										/>
										{!this.dateContractValidator(this.state.endContract) ? (
											<Text style={this.styles.textDanger}>Data inserata este invalida</Text>
										) : null}
									</View>
								</View>
							</View>
						</View>
					</View>
					{this.state.keyboardOn ? null : (
						<View style={{ flex: 1 }}>
								<View
									style={
										this.validateAll(this.state.editMode) ? (
											this.styles.saveButtonContainer
										) : (
											this.styles.saveButtonDisabledContainer
										)
									}
								>
									<TouchableOpacity
										onPress={this.submitCreate}
										disabled={!this.validateAll(this.state.editMode)}
									>
										<View style={this.styles.buttonContainer}>
											<Text style={{ color: 'white', fontSize: 20 }}>
												{ this.state.editMode ? 'Editeaza Document' : 'Creaza Document' }
										</Text>
										</View>
									</TouchableOpacity>
								</View>
						</View>
					)}
					<Spinner
						visible={this.state.showLoading}
						textContent={this.state.editMode ? 'Actualizeaza document...' : 'Adauga document...'}
						textStyle={{ color: '#8A4C7D' }}
					/>
				</ScrollView>
			</View>
		);
	}

	styles = StyleSheet.create({
		createDocumentContainer     : {
			flex           : 1,
			justifyContent : 'flex-start',
			alignItems     : 'flex-start',
			marginLeft     : 20,
			marginTop      : 60
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
			marginBottom    : 10,
			borderRadius    : 20,
			paddingLeft     : 20,
			marginTop       : 10
		},

		customInputsDanger          : {
			width           : 260,
			height          : 48,
			backgroundColor : '#EBEBEF',
			marginBottom    : 10,
			borderRadius    : 20,
			paddingLeft     : 20,
			marginTop       : 10,
			borderColor     : 'red',
			borderWidth     : 2
		},

		textDanger                  : {
			color        : 'red',
			marginBottom : 10
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

		marginBottom                : {
			marginBottom : 25
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
		},

		infoTextStyle               : {
			fontSize   : 14,
			fontWeight : '600'
		}
	});
}
