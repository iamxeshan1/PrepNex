import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { logActivity, ActivityAction } from './activityLogger';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getExams = async () => {
  const path = 'exams';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getTestsByExamId = async (examId: string) => {
  const path = 'tests';
  try {
    const q = query(collection(db, path), where('examId', '==', examId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const getQuestionsByTestId = async (testId: string) => {
  const path = 'questions';
  try {
    const q = query(collection(db, path), where('testId', '==', testId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const saveResult = async (resultData: any) => {
  const path = 'results';
  try {
    const resRef = doc(collection(db, path));
    const finalData = { 
      ...resultData, 
      resultId: resRef.id, 
      date: new Date().toISOString(),
      timestamp: Timestamp.now()
    };
    await setDoc(resRef, finalData);
    
    // Log activity
    await logActivity(resultData.userId, ActivityAction.TEST_ATTEMPT, `Attempted test with ID: ${resultData.testId}, Score: ${resultData.score}/${resultData.maxMarks || 100}`);

    return resRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getResultsByTestId = async (userId: string, testId: string) => {
  const path = 'results';
  try {
    const q = query(
      collection(db, path), 
      where('userId', '==', userId), 
      where('testId', '==', testId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const createSubscription = async (userId: string, examId: string, amount: number = 0) => {
  const path = 'subscriptions';
  const id = `${userId}_${examId}`;
  try {
    await setDoc(doc(db, path, id), {
      subscriptionId: id,
      userId,
      examId,
      amount,
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      paymentStatus: 'completed'
    });
    
    // Also update user profile
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const purchased = data.purchasedExams || [];
      if (!purchased.includes(examId)) {
        await updateDoc(userRef, {
          purchasedExams: [...purchased, examId]
        });
      }
    }
    
    // Log activity
    await logActivity(userId, ActivityAction.SUBSCRIPTION_CHANGE, `Purchased exam subscription: ${examId} for ₹${amount}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const activatePremiumAccess = async (userId: string, months: number = 12, amount: number = 0) => {
  const path = 'premium_subscriptions';
  const id = `${userId}_global`;
  try {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    await setDoc(doc(db, path, id), {
      userId,
      type: 'global',
      amount,
      purchaseDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: 'active'
    });

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPremium: true,
      premiumExpiry: expiryDate.toISOString()
    });

    // Log Activity
    await logActivity(userId, ActivityAction.SUBSCRIPTION_CHANGE, `Activated ${months}-month Premium Pass for ₹${amount}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

