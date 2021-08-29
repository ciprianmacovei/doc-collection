import React from 'react';
import { Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CreateDocument from './TabScreens/CreateDocument';
import ListDocuments from './TabScreens/ListDocuments';
import { firebase } from '../../firebase';

const Tab = createBottomTabNavigator();
export default class Documents extends React.Component {
	componentDidMount() {
		firebase
			.auth()
			.signInWithEmailAndPassword('cipp@cipp.com', 'cipp123')
			.catch((error) => {
				Alert(error);
			});
	}

	render() {
		return (
			<Tab.Navigator
				animationEnabled={true}
				tabBarOptions={{
					lazy: true,
					keyboardHidesTabBar: true,
					showIcon: true,
					tabStyle: { paddingBottom: 4 }
				}}
			>
				<Tab.Screen
					name="Create"
					component={CreateDocument}
					options={{
						tabBarIcon : () => <Image name="home" source={require('../../assets/add_to_photos.png')} />
					}}
				/>
				<Tab.Screen
					name="List"
					component={ListDocuments}
					options={{
						tabBarIcon : () => <Image name="home" source={require('../../assets/grid_on.png')} />
					}}
				/>
			</Tab.Navigator>
		);
	}
}
