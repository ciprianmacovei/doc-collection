import React from 'react';
import {
	View,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Text,
	Alert,
	Image,
	TouchableWithoutFeedback,
	Keyboard
} from 'react-native';
import { firebase } from '../../firebase';

export default class Login extends React.Component {
	state = {
		email                  : '',
		password               : '',
		login                  : true,
		icon                   : undefined,
		emailInputHighlight    : false,
		passwordInputHighlight : false
	};

	constructor(props) {
		super(props);
	}

	componentDidMount() {}

	handleEmailChange = (value) => {
		this.setState({ email: value });
	};

	handlePasswordChange = (value) => {
		this.setState({ password: value });
	};

	focusInput = (inputName) => {
		if (inputName === 'email') {
			this.setState({ emailInputHighlight: true });
			this.setState({ passwordInputHighlight: false });
		}
		if (inputName === 'password') {
			this.setState({ passwordInputHighlight: true });
			this.setState({ emailInputHighlight: false });
		}
	};

	removeFocus = () => {
		if (this.state.emailInputHighlight) {
			this.setState({ emailInputHighlight: false });
		}
		if (this.state.passwordInputHighlight) {
			this.setState({ passwordInputHighlight: false });
		}
		Keyboard.dismiss();
	};

	submitRegister = () => {
		firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password).then((user) => {
			this.setState({ login: true });
		});
	};

	submitLogin = () => {
		firebase
			.auth()
			.signInWithEmailAndPassword(this.state.email, this.state.password)
			.then((res) => {
				this.props.navigation.navigate('Documents');
			})
			.catch((error) => {
				Alert(error);
			});
	};

	render() {
		return (
			<View style={this.styles.container}>
				<TouchableWithoutFeedback onPress={this.removeFocus}>
					<View>
						<Image style={this.styles.topImg} source={require('../../assets/Group63.png')} />
						<View style={this.styles.inputsContainer}>
							{!this.state.login ? (
								<Text style={this.styles.pageDescription}> Create account </Text>
							) : (
								<Text style={this.styles.pageDescription}> Welcome! </Text>
							)}

							<TextInput
								placeholder="Email"
								placeholderTextColor="grey"
								style={
									this.state.emailInputHighlight ? (
										this.styles.inputsContainerHighLight
									) : (
										this.styles.customInputs
									)
								}
								onChangeText={this.handleEmailChange}
								onFocus={() => this.focusInput('email')}
								autoCapitalize="none"
							/>

							<TextInput
								placeholder="Password"
								placeholderTextColor="grey"
								style={
									this.state.passwordInputHighlight ? (
										this.styles.inputsContainerHighLight
									) : (
										this.styles.customInputs
									)
								}
								onChangeText={this.handlePasswordChange}
								onFocus={() => this.focusInput('password')}
								autoCapitalize="none"
								secureTextEntry={true}
							/>
							<TouchableOpacity onPress={this.state.login ? this.submitLogin : this.submitRegister}>
								<View style={this.styles.buttonContainer}>
									{this.state.login ? (
										<Text style={this.styles.loginActionButtonText}>Log In</Text>
									) : (
										<Text style={this.styles.loginActionButtonText}>Register</Text>
									)}
								</View>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => this.setState({ login: !this.state.login })}
								style={this.styles.footerContainer}
							>
								{!this.state.login ? <Text>Log In ?</Text> : <Text>Register ?</Text>}
							</TouchableOpacity>
						</View>
					</View>
				</TouchableWithoutFeedback>
			</View>
		);
	}

	styles = StyleSheet.create({
		container                : {
			flex           : 1,
			justifyContent : 'center',
			alignItems     : 'center'
		},

		topImg                   : {
			marginBottom : 'auto'
		},

		pageDescription          : {
			marginBottom : 50,
			fontSize     : 33,
			lineHeight   : 44,
			fontWeight   : '600',
			color        : '#2F262E'
		},

		customInputs             : {
			width           : 260,
			height          : 48,
			backgroundColor : '#EBEBEF',
			marginBottom    : 30,
			borderRadius    : 20,
			paddingLeft     : 20
		},

		inputsContainerHighLight : {
			width           : 260,
			height          : 48,
			backgroundColor : '#ececec',
			marginBottom    : 30,
			borderRadius    : 20,
			paddingLeft     : 20,
			borderWidth     : 1
		},

		buttonContainer          : {
			marginTop       : 20,
			width           : 226,
			height          : 45,
			backgroundColor : '#8A4C7D',
			justifyContent  : 'center',
			alignItems      : 'center',
			borderRadius    : 14
		},

		loginActionButtonText    : {
			color      : 'white',
			fontWeight : '700',
			fontSize   : 14
		},

		footerContainer          : {
			marginTop : 100
		},

		inputsContainer          : {
			flex           : 1,
			justifyContent : 'center',
			alignItems     : 'center'
		}
	});
}
