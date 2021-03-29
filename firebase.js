import * as firebase from 'firebase';
import '@firebase/auth';
import '@firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyAMsamsYNUH5VAivVuvSjFVUgXXLOGsbR8',
	authDomain: 'doc-collection-3ed14.firebaseapp.com',
	projectId: 'doc-collection-3ed14',
	storageBucket: 'doc-collection-3ed14.appspot.com',
	messagingSenderId: '1087022135845',
	appId: '1:1087022135845:web:159d0382b25ae9d8755dcc',
	measurementId: 'G-3SN49PTT9E'
};

if (!firebase.apps.length) {
	firebase.initializeApp(firebaseConfig);
}

const storageRef = firebase.storage().refFromURL('gs://doc-collection-3ed14.appspot.com/');

export { firebase, storageRef };
