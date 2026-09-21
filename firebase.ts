import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Pre-init check: If user has been inactive for > 30 days, purge old local Firestore cache to reclaim browser storage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const lastActiveRaw = localStorage.getItem('duo_firestore_last_active');
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    if (lastActiveRaw) {
      const lastActive = parseInt(lastActiveRaw, 10);
      if (!isNaN(lastActive) && Date.now() - lastActive >= THIRTY_DAYS_MS) {
        const inactiveDays = parseFloat(((Date.now() - lastActive) / (1000 * 60 * 60 * 24)).toFixed(1));
        console.warn(`[Firestore Pre-Init] User inactive for ${inactiveDays} days (> 30 days). Purging old local Firestore IndexedDB cache...`);
        const projectId = firebaseConfig.projectId;
        const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
        if (window.indexedDB) {
          const candidateDbNames = [
            `firestore/[DEFAULT]/${projectId}/main`,
            `firestore/[DEFAULT]/${databaseId}/main`,
            `firestore/[DEFAULT]/${projectId}`,
            `firestore/[DEFAULT]/${databaseId}`,
            `firestore/[DEFAULT]/main`,
            `firebase-heartbeat-database`
          ];
          for (const name of candidateDbNames) {
            try {
              window.indexedDB.deleteDatabase(name);
            } catch (delErr) {
              console.warn(`[Firestore Pre-Init] Could not delete ${name}:`, delErr);
            }
          }
        }
        localStorage.setItem('duo_firestore_cache_last_cleanup', Date.now().toString());
        localStorage.setItem('duo_firestore_cache_cleanup_meta', JSON.stringify({
          timestamp: Date.now(),
          dateString: new Date().toLocaleString(),
          reason: `Automatic startup purge after ${inactiveDays} days of inactivity (> 30 days)`,
          freedDatabases: ['Firestore IndexedDB cache'],
          freedStorageKeys: [],
          inactiveDays
        }));
        // Update last active so it doesn't repeatedly clear on every reload
        localStorage.setItem('duo_firestore_last_active', Date.now().toString());
      }
    } else {
      localStorage.setItem('duo_firestore_last_active', Date.now().toString());
    }
  } catch (checkErr) {
    console.warn('[Firestore Pre-Init] Inactivity check error:', checkErr);
  }
}

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
export const githubProvider = new GithubAuthProvider();

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
