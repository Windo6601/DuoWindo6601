import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling and multi-tab persistent local cache safely
let db: any;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.warn('Failed to initialize Firestore with persistentLocalCache, falling back to default memory or single-tab cache:', error);
  try {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } catch (err2) {
    db = getFirestore(app);
  }
}

export { db };

export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // Determine if this is a strict permission/authorization error
  const isPermissionDenied = 
    errMessage.includes('permission-denied') || 
    errMessage.toLowerCase().includes('permission') || 
    errMessage.toLowerCase().includes('insufficient');

  if (isPermissionDenied) {
    console.warn('Firestore Permission Denied detected. Staying stable and fallback to offline mode:', errInfo);
  }
}
