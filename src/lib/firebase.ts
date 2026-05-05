import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use default settings but keep databaseId
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export default app;
