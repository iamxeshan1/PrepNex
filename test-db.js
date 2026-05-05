import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import process from 'process';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

if (!getApps().length) {
    initializeApp({ projectId: config.projectId });
}
const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" ? config.firestoreDatabaseId : undefined;
const db = getFirestore(getApp(), dbId);

db.collection('settings').doc('razorpay').get().then(doc => {
    console.log("DB RAZORPAY SETTINGS:", doc.data());
});
