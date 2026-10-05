import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProgress } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

export interface FirebaseAuthExportData {
  uid: string | null;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  isAnonymous: boolean;
  tenantId: string | null;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: {
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }[];
  authProvider: string;
}

export interface FirebaseFirestoreExportData {
  databaseId: string;
  projectId: string;
  userDocumentPath: string | null;
  userDocumentData: any | null;
  userFeedbackCount: number;
  userFeedbackItems: any[];
  userSupportTicketsCount: number;
  userSupportTicketItems: any[];
  syncedAt: string;
}

export interface FirebaseExportSummary {
  isCloudActive: boolean;
  authProvider: string;
  uid: string | null;
  email: string | null;
  displayName: string;
  username: string;
  xp: number;
  gems: number;
  streak: number;
  completedLessonsCount: number;
  learnedWordsCount: number;
  mistakesCount: number;
  feedbackCount: number;
  ticketsCount: number;
  chessElo: number;
  projectId: string;
  databaseId: string;
}

export interface FirebaseExportPayload {
  exportVersion: '1.0';
  app: 'DuoWindo6601';
  exportedAt: string;
  source: 'Firebase Firestore & Authentication';
  summary: FirebaseExportSummary;
  firebaseAuth: FirebaseAuthExportData;
  firebaseFirestore: FirebaseFirestoreExportData;
  localUserProgress: UserProgress;
}

/**
 * Returns instant synchronous summary of Firebase and profile stats for UI rendering.
 */
export function getQuickFirebaseSummary(
  user: UserProgress,
  firebaseUser: FirebaseUser | null
): FirebaseExportSummary {
  const currentAuthUser = firebaseUser || auth.currentUser;
  return {
    isCloudActive: Boolean(currentAuthUser),
    authProvider: currentAuthUser?.providerData?.[0]?.providerId === 'google.com' 
      ? 'Google' 
      : (currentAuthUser?.email ? 'Email / Password' : (user.authProvider || 'Local / Incognito')),
    uid: currentAuthUser?.uid || null,
    email: currentAuthUser?.email || user.email || null,
    displayName: currentAuthUser?.displayName || user.name || 'Пользователь DuoWindo',
    username: user.username || (currentAuthUser?.uid ? currentAuthUser.uid.slice(0, 8) : 'guest'),
    xp: user.xp || 0,
    gems: user.gems || 0,
    streak: user.streak || 0,
    completedLessonsCount: user.completedLessons?.length || 0,
    learnedWordsCount: user.learnedWords?.length || 0,
    mistakesCount: user.mistakes?.length || 0,
    feedbackCount: 0,
    ticketsCount: 0,
    chessElo: user.chessStats?.elo || 1200,
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  };
}

/**
 * Fetches and packages complete live Firebase Firestore and Auth data for the current user.
 */
export async function generateFirebaseExportPayload(
  user: UserProgress,
  firebaseUser: FirebaseUser | null
): Promise<FirebaseExportPayload> {
  const currentAuthUser = firebaseUser || auth.currentUser;

  // 1. Build Firebase Auth Export Data
  const authExport: FirebaseAuthExportData = {
    uid: currentAuthUser ? currentAuthUser.uid : null,
    email: currentAuthUser?.email || user.email || null,
    emailVerified: currentAuthUser?.emailVerified || false,
    displayName: currentAuthUser?.displayName || user.name || null,
    photoURL: currentAuthUser?.photoURL || user.avatarUrl || null,
    phoneNumber: currentAuthUser?.phoneNumber || user.phone || null,
    isAnonymous: currentAuthUser?.isAnonymous || (user.authProvider === 'guest'),
    tenantId: currentAuthUser?.tenantId || null,
    metadata: {
      creationTime: currentAuthUser?.metadata?.creationTime,
      lastSignInTime: currentAuthUser?.metadata?.lastSignInTime,
    },
    providerData: currentAuthUser?.providerData?.map(p => ({
      providerId: p.providerId,
      uid: p.uid,
      displayName: p.displayName,
      email: p.email,
      phoneNumber: p.phoneNumber,
      photoURL: p.photoURL,
    })) || [],
    authProvider: currentAuthUser?.providerData?.[0]?.providerId === 'google.com'
      ? 'Google'
      : (currentAuthUser?.email ? 'Email / Password' : (user.authProvider || 'Local / Incognito')),
  };

  // 2. Fetch User Document from Firestore
  let userDocData: any = null;
  let userDocPath: string | null = null;
  let feedbackItems: any[] = [];
  let supportTickets: any[] = [];

  const targetUid = currentAuthUser?.uid;

  if (targetUid) {
    userDocPath = `users/${targetUid}`;
    try {
      const userDocRef = doc(db, 'users', targetUid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        userDocData = userDocSnap.data();
      }
    } catch (err) {
      console.warn('Error fetching user document for export:', err);
      handleFirestoreError(err, OperationType.GET, userDocPath);
    }

    // Try fetching user feedback reviews from Firestore
    try {
      const feedbackQuery = query(
        collection(db, 'feedback'),
        where('userId', '==', targetUid)
      );
      const feedbackSnap = await getDocs(feedbackQuery);
      feedbackItems = feedbackSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (err) {
      console.warn('Error fetching user feedback for export:', err);
    }

    // Try fetching user support tickets from Firestore
    try {
      const ticketsQuery = query(
        collection(db, 'support_tickets'),
        where('userId', '==', targetUid)
      );
      const ticketsSnap = await getDocs(ticketsQuery);
      supportTickets = ticketsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (err) {
      console.warn('Error fetching support tickets for export:', err);
    }
  }

  // 3. Build Firestore Export Data
  const firestoreExport: FirebaseFirestoreExportData = {
    databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
    projectId: firebaseConfig.projectId,
    userDocumentPath: userDocPath,
    userDocumentData: userDocData || { ...user },
    userFeedbackCount: feedbackItems.length,
    userFeedbackItems: feedbackItems,
    userSupportTicketsCount: supportTickets.length,
    userSupportTicketItems: supportTickets,
    syncedAt: new Date().toISOString(),
  };

  const summary: FirebaseExportSummary = {
    isCloudActive: Boolean(currentAuthUser),
    authProvider: authExport.authProvider,
    uid: authExport.uid,
    email: authExport.email,
    displayName: authExport.displayName || user.name || 'Пользователь DuoWindo',
    username: user.username || (authExport.uid ? authExport.uid.slice(0, 8) : 'guest'),
    xp: user.xp || 0,
    gems: user.gems || 0,
    streak: user.streak || 0,
    completedLessonsCount: user.completedLessons?.length || 0,
    learnedWordsCount: user.learnedWords?.length || 0,
    mistakesCount: user.mistakes?.length || 0,
    feedbackCount: feedbackItems.length,
    ticketsCount: supportTickets.length,
    chessElo: user.chessStats?.elo || 1200,
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  };

  return {
    exportVersion: '1.0',
    app: 'DuoWindo6601',
    exportedAt: new Date().toISOString(),
    source: 'Firebase Firestore & Authentication',
    summary,
    firebaseAuth: authExport,
    firebaseFirestore: firestoreExport,
    localUserProgress: { ...user },
  };
}

/**
 * Downloads Firebase Firestore & Auth export as a formatted .json file.
 */
export async function downloadFirebaseExportFile(
  user: UserProgress,
  firebaseUser: FirebaseUser | null
): Promise<string> {
  const payload = await generateFirebaseExportPayload(user, firebaseUser);
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];
  const ident = (payload.firebaseAuth.uid || user.username || user.name || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `duowindo6601_firebase_export_${ident}_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Copies the Firebase Firestore & Auth export data directly to clipboard.
 */
export async function copyFirebaseExportToClipboard(
  user: UserProgress,
  firebaseUser: FirebaseUser | null
): Promise<boolean> {
  const payload = await generateFirebaseExportPayload(user, firebaseUser);
  const jsonStr = JSON.stringify(payload, null, 2);

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(jsonStr);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = jsonStr;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
