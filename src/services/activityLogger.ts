import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export enum ActivityAction {
  TEST_ATTEMPT = 'TEST_ATTEMPT',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  SUBSCRIPTION_CHANGE = 'SUBSCRIPTION_CHANGE'
}

export const logActivity = async (userId: string, action: ActivityAction, details: string) => {
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const userSnap = await getDoc(doc(db, 'users', userId));
    const userData = userSnap.data() || {};
    
    await addDoc(collection(db, 'activity_logs'), {
      userId,
      userName: userData.name || 'Unknown User',
      userEmail: userData.email || 'No Email',
      action,
      details,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
