import firebaseConfig from '../firebase-applet-config.json';
import { db } from '../firebase';
import { terminate, clearIndexedDbPersistence } from 'firebase/firestore';

export const FIRESTORE_INACTIVITY_THRESHOLD_DAYS = 30;
export const FIRESTORE_INACTIVITY_THRESHOLD_MS = FIRESTORE_INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

export const STORAGE_KEY_LAST_ACTIVE = 'duo_firestore_last_active';
export const STORAGE_KEY_LAST_CLEANUP = 'duo_firestore_cache_last_cleanup';
export const STORAGE_KEY_CLEANUP_META = 'duo_firestore_cache_cleanup_meta';

export interface FirestoreCacheCleanupMeta {
  timestamp: number;
  dateString: string;
  reason: string;
  freedDatabases: string[];
  freedStorageKeys: string[];
  inactiveDays: number;
}

export interface FirestoreCacheStatus {
  isInactiveOverThreshold: boolean;
  lastActiveTimestamp: number;
  lastActiveDateString: string;
  inactiveMs: number;
  inactiveDays: number;
  thresholdDays: number;
  lastCleanupTimestamp: number | null;
  lastCleanupDateString: string | null;
  lastCleanupMeta: FirestoreCacheCleanupMeta | null;
}

// Throttle activity updates so we do not spam localStorage
let lastThrottledRecord = 0;
const ACTIVITY_RECORD_THROTTLE_MS = 15000; // 15 seconds

/**
 * Record user activity timestamp in localStorage.
 * Call this during user interactions, navigation, syncing, or lesson completions.
 */
export function recordFirestoreUserActivity(force: boolean = false): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (!force && now - lastThrottledRecord < ACTIVITY_RECORD_THROTTLE_MS) {
    return;
  }
  lastThrottledRecord = now;
  try {
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
  } catch (e) {
    console.warn('[Firestore Cache] Unable to write activity timestamp to localStorage:', e);
  }
}

/**
 * Get current inactivity and cache status
 */
export function getFirestoreCacheStatus(): FirestoreCacheStatus {
  if (typeof window === 'undefined') {
    return {
      isInactiveOverThreshold: false,
      lastActiveTimestamp: Date.now(),
      lastActiveDateString: new Date().toLocaleString(),
      inactiveMs: 0,
      inactiveDays: 0,
      thresholdDays: FIRESTORE_INACTIVITY_THRESHOLD_DAYS,
      lastCleanupTimestamp: null,
      lastCleanupDateString: null,
      lastCleanupMeta: null,
    };
  }

  const now = Date.now();
  const lastActiveRaw = localStorage.getItem(STORAGE_KEY_LAST_ACTIVE);
  let lastActiveTimestamp = now;

  if (lastActiveRaw) {
    const parsed = parseInt(lastActiveRaw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      lastActiveTimestamp = parsed;
    } else {
      // Invalid entry, reset to now
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
    }
  } else {
    // First visit: establish initial activity timestamp
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, now.toString());
  }

  const inactiveMs = Math.max(0, now - lastActiveTimestamp);
  const inactiveDays = parseFloat((inactiveMs / (1000 * 60 * 60 * 24)).toFixed(1));
  const isInactiveOverThreshold = inactiveMs >= FIRESTORE_INACTIVITY_THRESHOLD_MS;

  const lastCleanupRaw = localStorage.getItem(STORAGE_KEY_LAST_CLEANUP);
  let lastCleanupTimestamp: number | null = null;
  let lastCleanupDateString: string | null = null;
  if (lastCleanupRaw) {
    const parsed = parseInt(lastCleanupRaw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      lastCleanupTimestamp = parsed;
      lastCleanupDateString = new Date(parsed).toLocaleString();
    }
  }

  const cleanupMetaRaw = localStorage.getItem(STORAGE_KEY_CLEANUP_META);
  let lastCleanupMeta: FirestoreCacheCleanupMeta | null = null;
  if (cleanupMetaRaw) {
    try {
      lastCleanupMeta = JSON.parse(cleanupMetaRaw);
    } catch {
      lastCleanupMeta = null;
    }
  }

  return {
    isInactiveOverThreshold,
    lastActiveTimestamp,
    lastActiveDateString: new Date(lastActiveTimestamp).toLocaleString(),
    inactiveMs,
    inactiveDays,
    thresholdDays: FIRESTORE_INACTIVITY_THRESHOLD_DAYS,
    lastCleanupTimestamp,
    lastCleanupDateString,
    lastCleanupMeta,
  };
}

/**
 * Delete a specific IndexedDB database with a safety timeout promise
 */
function deleteIndexedDatabaseSafely(dbName: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(false);
      return;
    }

    try {
      const req = window.indexedDB.deleteDatabase(dbName);
      let resolved = false;

      const finish = (result: boolean) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      req.onsuccess = () => finish(true);
      req.onerror = () => finish(false);
      req.onblocked = () => {
        console.warn(`[Firestore Cache] IndexedDB deletion blocked for ${dbName}, proceeding...`);
        finish(false);
      };

      // Safety timeout in case indexedDB hangs
      setTimeout(() => finish(false), 2000);
    } catch (err) {
      console.warn(`[Firestore Cache] Failed to initiate deletion for ${dbName}:`, err);
      resolve(false);
    }
  });
}

/**
 * Discover and delete all Firestore local cache IndexedDB databases
 */
async function purgeIndexedDbFirestoreDatabases(): Promise<string[]> {
  const freedDatabases: string[] = [];
  if (typeof window === 'undefined' || !window.indexedDB) return freedDatabases;

  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

  // Known standard Firestore indexedDB database names
  const candidateNames = new Set<string>([
    `firestore/[DEFAULT]/${projectId}/main`,
    `firestore/[DEFAULT]/${databaseId}/main`,
    `firestore/[DEFAULT]/${projectId}`,
    `firestore/[DEFAULT]/${databaseId}`,
    `firestore/[DEFAULT]/main`,
    `firebase-heartbeat-database`
  ]);

  // If modern browser supports indexedDB.databases(), discover all matching databases
  if (typeof window.indexedDB.databases === 'function') {
    try {
      const dbs = await window.indexedDB.databases();
      for (const d of dbs) {
        if (d.name && (d.name.startsWith('firestore') || d.name.includes(projectId) || d.name.includes(databaseId))) {
          candidateNames.add(d.name);
        }
      }
    } catch (e) {
      console.warn('[Firestore Cache] Error querying indexedDB.databases():', e);
    }
  }

  for (const dbName of candidateNames) {
    try {
      const success = await deleteIndexedDatabaseSafely(dbName);
      if (success) {
        freedDatabases.push(dbName);
        console.log(`[Firestore Cache] Successfully deleted IndexedDB cache database: ${dbName}`);
      }
    } catch (e) {
      console.warn(`[Firestore Cache] Error deleting IndexedDB ${dbName}:`, e);
    }
  }

  return freedDatabases;
}

/**
 * Clean any lingering Firestore persistent cache keys from localStorage / sessionStorage
 */
function purgeFirestoreStorageTokens(): string[] {
  const freedKeys: string[] = [];
  if (typeof window === 'undefined') return freedKeys;

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('firestore_') || key.startsWith('firebase:firestore:') || key.startsWith('duo_firestore_temp_'))) {
        localStorage.removeItem(key);
        freedKeys.push(key);
      }
    }
  } catch (e) {
    console.warn('[Firestore Cache] Error cleaning localStorage tokens:', e);
  }

  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('firestore_') || key.startsWith('firebase:firestore:'))) {
        sessionStorage.removeItem(key);
        freedKeys.push(key);
      }
    }
  } catch (e) {
    console.warn('[Firestore Cache] Error cleaning sessionStorage tokens:', e);
  }

  return freedKeys;
}

/**
 * Purge old local Firestore cache (IndexedDB + storage tokens).
 * If force is false, it only purges if user was inactive for more than 30 days.
 */
export async function purgeOldFirestoreCache(
  reason: string = 'inactivity_30_days',
  force: boolean = false
): Promise<{ success: boolean; freedDatabases: string[]; freedStorageKeys: string[]; meta: FirestoreCacheCleanupMeta }> {
  const status = getFirestoreCacheStatus();

  if (!force && !status.isInactiveOverThreshold) {
    return {
      success: false,
      freedDatabases: [],
      freedStorageKeys: [],
      meta: {
        timestamp: Date.now(),
        dateString: new Date().toLocaleString(),
        reason: 'Threshold not exceeded',
        freedDatabases: [],
        freedStorageKeys: [],
        inactiveDays: status.inactiveDays,
      }
    };
  }

  console.log(`[Firestore Cache] Purging old cache (inactive for ${status.inactiveDays} days > ${FIRESTORE_INACTIVITY_THRESHOLD_DAYS} days threshold). Reason: ${reason}`);

  // 1. Try to terminate active Firestore instance and clear persistence via official SDK
  try {
    if (db && !db._terminated) {
      await terminate(db);
      console.log('[Firestore Cache] Terminated Firestore instance prior to cache purge.');
      await clearIndexedDbPersistence(db);
      console.log('[Firestore Cache] clearIndexedDbPersistence executed successfully.');
    }
  } catch (sdkErr: any) {
    // If instance is already active or in-use, fallback to direct IndexedDB and storage purge
    console.info('[Firestore Cache] SDK clear note (proceeding with direct storage purge):', sdkErr?.message || sdkErr);
  }

  // 2. Directly purge all Firestore IndexedDB databases
  const freedDatabases = await purgeIndexedDbFirestoreDatabases();

  // 3. Purge storage tokens
  const freedStorageKeys = purgeFirestoreStorageTokens();

  // 4. Save metadata
  const cleanupMeta: FirestoreCacheCleanupMeta = {
    timestamp: Date.now(),
    dateString: new Date().toLocaleString(),
    reason: force ? (reason || 'Manual user cleanup') : `Inactivity for ${status.inactiveDays} days (> ${FIRESTORE_INACTIVITY_THRESHOLD_DAYS} days)`,
    freedDatabases,
    freedStorageKeys,
    inactiveDays: status.inactiveDays,
  };

  try {
    localStorage.setItem(STORAGE_KEY_LAST_CLEANUP, cleanupMeta.timestamp.toString());
    localStorage.setItem(STORAGE_KEY_CLEANUP_META, JSON.stringify(cleanupMeta));
    // Reset last active timestamp to current time so cleanup doesn't re-trigger immediately
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
    lastThrottledRecord = Date.now();
  } catch (e) {
    console.warn('[Firestore Cache] Could not save cleanup metadata:', e);
  }

  return {
    success: true,
    freedDatabases,
    freedStorageKeys,
    meta: cleanupMeta,
  };
}

/**
 * Initialize automated Firestore cache maintenance.
 * Checks inactivity, executes auto-purge if user was inactive > 30 days,
 * and sets up window activity listeners.
 */
export function initFirestoreCacheMaintenance(onCleaned?: (meta: FirestoreCacheCleanupMeta) => void): void {
  if (typeof window === 'undefined') return;

  const status = getFirestoreCacheStatus();

  if (status.isInactiveOverThreshold) {
    console.warn(`[Firestore Cache Maintenance] User was inactive for ${status.inactiveDays} days (threshold is ${FIRESTORE_INACTIVITY_THRESHOLD_DAYS} days). Starting automatic cache purge to free browser space...`);
    purgeOldFirestoreCache(`Automatic purge after ${status.inactiveDays} days inactivity`, true)
      .then((result) => {
        if (result.success) {
          console.log(`[Firestore Cache Maintenance] Auto-purge finished! Reclaimed ${result.freedDatabases.length} IndexedDB databases.`);
          if (onCleaned) {
            onCleaned(result.meta);
          }
        }
      })
      .catch((err) => {
        console.error('[Firestore Cache Maintenance] Auto-purge encountered an error:', err);
      });
  } else {
    console.log(`[Firestore Cache Maintenance] Cache state healthy: last active ${status.inactiveDays} days ago (auto-cleanup threshold: ${FIRESTORE_INACTIVITY_THRESHOLD_DAYS} days).`);
    recordFirestoreUserActivity(true);
  }

  // Setup user activity listeners
  setupActivityListeners();
}

let listenersAttached = false;
export function setupActivityListeners(): void {
  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;

  const handleActivity = () => {
    recordFirestoreUserActivity();
  };

  window.addEventListener('click', handleActivity, { passive: true });
  window.addEventListener('keydown', handleActivity, { passive: true });
  window.addEventListener('touchstart', handleActivity, { passive: true });
  window.addEventListener('focus', handleActivity, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      recordFirestoreUserActivity(true);
    }
  });

  window.addEventListener('beforeunload', () => {
    recordFirestoreUserActivity(true);
  });
}

/**
 * Testing utility: Simulate 31 days of user inactivity to test auto-clean mechanism
 */
export function simulateInactivityForTesting(days: number = 31): FirestoreCacheStatus {
  if (typeof window === 'undefined') return getFirestoreCacheStatus();
  const simulatedTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, simulatedTime.toString());
  lastThrottledRecord = 0;
  console.log(`[Firestore Cache Simulation] Inactivity simulated to ${days} days ago.`);
  return getFirestoreCacheStatus();
}

/**
 * Testing utility: Reset activity timer to now
 */
export function resetInactivityTimer(): FirestoreCacheStatus {
  if (typeof window === 'undefined') return getFirestoreCacheStatus();
  localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
  lastThrottledRecord = Date.now();
  console.log('[Firestore Cache Simulation] Inactivity timer reset to now.');
  return getFirestoreCacheStatus();
}
