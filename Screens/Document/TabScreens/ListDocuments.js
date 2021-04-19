import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	ScrollView,
	Alert,
	Modal,
	TouchableHighlight,
	ActivityIndicator,
	Image,
	TextInput
} from 'react-native';
import { WebView } from 'react-native-webview';
import { storageRef } from '../../../firebase';
import { ConfirmDialog } from 'react-native-simple-dialogs';

export default class ListDocuments extends React.Component {

	state = {
		modalVisible: false,
		modalUrl: '',
		listOfFilesMetadata: [],
		initialListOfFiles: [],
		dialogVisible: false,
		deleteFileName: undefined
	};

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		this.props.navigation.addListener('focus', this.focusHandler);
	}

	componentWillUnmount() {
		this.props.navigation.removeListener('focus', this.focusHandler);
	}

	focusHandler = () => {
		this.getData();
	}

	getData = async () => {
		const arrayFilesRefs = await storageRef.listAll();
		const arrayFilesMeta = await Promise.all(arrayFilesRefs.items.map((ref) => ref.getMetadata()));
		console.log(arrayFilesMeta, '@@@@')
		if (arrayFilesMeta.length) {
			this.setState({ listOfFilesMetadata: arrayFilesMeta });
			this.setState({ initialListOfFiles: arrayFilesMeta });
		}
	};

	deleteFile = () => {
		storageRef.child(this.state.deleteFileName).delete().then(
			() => {
				const copyOfListFiles = [...this.state.listOfFilesMetadata].filter((file) => file.name !== this.state.deleteFileName);
				this.setState({ listOfFilesMetadata: copyOfListFiles });
				this.setState({ dialogVisible: false });
			},
			(error) => {
				if (error) Alert(error);
			}
		);
	};

	previewFile = (fileName) => {
		storageRef.child(fileName).getDownloadURL().then(
			(res) => {
				if (res) {
					this.setState({ modalUrl: res });
					this.setState({ modalVisible: true });
				}
			},
			(error) => {
				if (error) Alert(error);
			}
		);
	};

	editFile = (item) => {
		this.props.navigation.jumpTo('Create', { document: item });
	}

	searchDocument = (value) => {
		if (value === '') {
			this.setState({ listOfFilesMetadata: this.state.initialListOfFiles });
		} else {
			let searchArray = [...this.state.listOfFilesMetadata];
			if (searchArray.length) {
				searchArray = searchArray.filter((x) => x.name.indexOf(value) > -1);
				this.setState({ listOfFilesMetadata: searchArray });
			}
		}
	}

	loadingPdf = () => {
		return (
			<View style={this.styles.containerLoading}>
				<ActivityIndicator size="small" color="black" />
			</View>
		)
	}

	render() {
		const items = this.state.listOfFilesMetadata.map((item, index) => {
			return (
				<View style={this.styles.inputContainer} key={index}>
					<View style={this.styles.textPadding}>
						<View style={this.styles.cardDescription}>
							<Image style={{ marginRight: 8, width: 20, height: 20 }} source={require('../../../assets/title.png')} />
							<Text style={this.styles.description}>{item.name}</Text>
						</View>
						<View style={this.styles.cardTime}>
							<Image style={{ marginRight: 10, width: 15, height: 15 }} source={require('../../../assets/expires.png')} />
							<Text>{new Date(item.customMetadata?.notificationTime).toLocaleString()}</Text>
						</View>
					</View>

					<View style={this.styles.editContainer}>
						<TouchableOpacity onPress={() => this.previewFile(item.name)}>
							<View style={this.styles.viewDocumentButton}>
								<Image source={require('../../../assets/edit.png')} style={{ marginRight: 8 }} />
								<Text style={{ color: 'white' }}>View document</Text>
							</View>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => this.setState({ deleteFileName: item.name, dialogVisible: true })} style={{ marginLeft: 10 }}>
							<Image source={require('../../../assets/delete.png')} />
						</TouchableOpacity>
						<TouchableOpacity onPress={() => this.editFile(item)} style={{ marginLeft: 10 }}>
							<Image source={require('../../../assets/editFile.png')} />
						</TouchableOpacity>
					</View>
					<Modal
						animationType="slide"
						transparent={false}
						visible={this.state.modalVisible}
						onRequestClose={() => {
							Alert.alert('Modal has been closed.');
						}}
					>
						<WebView
							source={{ uri: this.state.modalUrl }}
							style={{ marginTop: 20 }}
							renderLoading={this.loadingPdf}
							startInLoadingState={true}
						/>
						<TouchableHighlight
							style={{ ...this.styles.openButton, backgroundColor: 'grey' }}
							onPress={() => {
								this.setState({ modalVisible: false });
							}}
						>
							<Text style={this.styles.textStyle}>Hide Modal</Text>
						</TouchableHighlight>
					</Modal>
					<ConfirmDialog
						title="Confirm Dialog"
						message={`Are you sure you want to delete ${this.state.deleteFileName} file?`}
						visible={this.state.dialogVisible}
						onTouchOutside={() => this.setState({ dialogVisible: false })}
						positiveButton={{
							title: "YES",
							onPress: () => this.deleteFile()
						}}
						negativeButton={{
							title: "NO",
							onPress: () => this.setState({ dialogVisible: false })
						}}
					/>
				</View>
			);
		});

		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<SafeAreaView>
					<TextInput
						placeholder="Document Name"
						style={this.styles.customInputs}
						autoCapitalize="none"
						onChangeText={this.searchDocument}
					/>
					<ScrollView>{items.length ? items : <Text>Loading</Text>}</ScrollView>
				</SafeAreaView>
			</View>
		);
	}

	styles = StyleSheet.create({

		customInputs: {
			width: 300,
			height: 48,
			backgroundColor: '#EBEBEF',
			marginBottom: 30,
			borderRadius: 20,
			paddingLeft: 20,
			marginTop: 10
		},

		viewDocumentButton: {
			backgroundColor: "#8A4C7D",
			width: 150,
			height: 45,
			justifyContent: 'center',
			alignItems: 'center',
			flexDirection: 'row',
			borderRadius: 8,
		},

		cardDescription: {
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'center',
		},

		cardTime: {
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'center',
			marginTop: 20,
			marginBottom: 10,
			paddingLeft: 3
		},

		description: {
			fontSize: 17,
			fontWeight: '600'
		},

		fullView: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		},

		inputContainer: {
			flexDirection: 'column',
			backgroundColor: '#EBEBEF',
			justifyContent: 'center',
			width: 300,
			height: 150,
			marginTop: 10,
			borderRadius: 15,
			padding: 10
		},

		textPadding: {
			padding: 5
		},

		editContainer: {
			marginLeft: 10,
			marginRight: 10,
			flexDirection: 'row',
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
			marginTop: 22
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
				height: 2
			},
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5
		},

		openButton: {
			backgroundColor: '#F194FF',
			borderRadius: 20,
			padding: 10,
			elevation: 2
		},

		textStyle: {
			color: 'white',
			fontWeight: 'bold',
			textAlign: 'center'
		},

		containerLoading: {
			position: 'absolute',
			top: '50%',
			left: '50%',
			paddingRight: 10
		},
		
	});
}
