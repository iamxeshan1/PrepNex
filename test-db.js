import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import process from 'process';

const FIREBASE_CONFIG = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : null;
if (!FIREBASE_CONFIG) {
    console.log("No FIREBASE_CONFIG");
    process.exit(1);
}

if (!getApps().length) {
    initializeApp({
        credential: cert(FIREBASE_CONFIG),
    });
}
const db = getFirestore();

db.collection('settings').doc('razorpay').get().then(doc => {
    console.log(doc.data());
});
