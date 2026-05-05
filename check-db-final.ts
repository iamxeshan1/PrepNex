import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp({ projectId: config.projectId });
const db = getFirestore(app, config.firestoreDatabaseId === '(default)' ? undefined : config.firestoreDatabaseId);

async function checkDb() {
  const doc = await db.collection('settings').doc('razorpay').get();
  if (doc.exists) {
    console.log('DB Razorpay Config:', doc.data());
  } else {
    console.log('No Razorpay config in DB.');
  }
}

checkDb().catch(console.error);
