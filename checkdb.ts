import { getDb } from './server.ts';

async function verify() {
    const db = getDb();
    const doc = await db.collection('settings').doc('razorpay').get();
    console.log(doc.data());
}

verify();
