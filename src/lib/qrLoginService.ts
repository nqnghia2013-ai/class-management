import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';

// ============================================================
// QR Login Session Service
// Quản lý phiên đăng nhập QR cross-device qua Firestore
// ============================================================

export type QRSessionStatus = 'pending' | 'scanned' | 'confirmed' | 'expired';

export interface QRLoginSession {
  sessionId: string;
  status: QRSessionStatus;
  createdAt: number; // timestamp ms
  expiresAt: number; // timestamp ms
  // Mobile user info (populated when scanned/confirmed)
  mobileUid?: string;
  mobileEmail?: string;
  mobileDisplayName?: string;
  mobilePhotoURL?: string;
}

const QR_SESSION_COLLECTION = 'qrLoginSessions';
const QR_SESSION_LIFETIME_MS = 60_000; // 60 seconds

/**
 * Generate a cryptographically random session ID
 */
function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Create a new QR login session in Firestore.
 * Returns the sessionId that should be encoded into the QR code.
 */
export async function createQRSession(): Promise<string> {
  const sessionId = generateSessionId();
  const now = Date.now();

  const session: QRLoginSession = {
    sessionId,
    status: 'pending',
    createdAt: now,
    expiresAt: now + QR_SESSION_LIFETIME_MS,
  };

  await setDoc(doc(db, QR_SESSION_COLLECTION, sessionId), session);
  return sessionId;
}

/**
 * Listen for real-time changes to a QR session.
 * Returns an unsubscribe function.
 */
export function listenQRSession(
  sessionId: string,
  callback: (session: QRLoginSession | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, QR_SESSION_COLLECTION, sessionId),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as QRLoginSession);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[QR Login] Error listening to session:', error);
      callback(null);
    }
  );
}

/**
 * Get a QR session by ID (one-time read).
 */
export async function getQRSession(sessionId: string): Promise<QRLoginSession | null> {
  const snapshot = await getDoc(doc(db, QR_SESSION_COLLECTION, sessionId));
  if (snapshot.exists()) {
    return snapshot.data() as QRLoginSession;
  }
  return null;
}

/**
 * Mobile: Mark session as "scanned" (intermediate state).
 * Shows the desktop that someone has scanned the QR code.
 */
export async function markSessionScanned(
  sessionId: string,
  mobileUser: { uid: string; email: string; displayName: string; photoURL?: string }
): Promise<void> {
  await setDoc(
    doc(db, QR_SESSION_COLLECTION, sessionId),
    {
      status: 'scanned',
      mobileUid: mobileUser.uid,
      mobileEmail: mobileUser.email,
      mobileDisplayName: mobileUser.displayName,
      mobilePhotoURL: mobileUser.photoURL || '',
    },
    { merge: true }
  );
}

/**
 * Mobile: Confirm the QR login session.
 * Desktop will detect this change and proceed with authentication.
 */
export async function confirmQRSession(
  sessionId: string,
  mobileUser: { uid: string; email: string; displayName: string; photoURL?: string }
): Promise<void> {
  await setDoc(
    doc(db, QR_SESSION_COLLECTION, sessionId),
    {
      status: 'confirmed',
      mobileUid: mobileUser.uid,
      mobileEmail: mobileUser.email,
      mobileDisplayName: mobileUser.displayName,
      mobilePhotoURL: mobileUser.photoURL || '',
    },
    { merge: true }
  );
}

/**
 * Delete a QR session (cleanup after use or expiry).
 */
export async function deleteQRSession(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, QR_SESSION_COLLECTION, sessionId));
  } catch (e) {
    console.warn('[QR Login] Error deleting session:', e);
  }
}

/**
 * Check if a session is still valid (not expired).
 */
export function isSessionValid(session: QRLoginSession): boolean {
  return session.status !== 'expired' && Date.now() < session.expiresAt;
}

/**
 * Mark a session as expired.
 */
export async function expireQRSession(sessionId: string): Promise<void> {
  try {
    await setDoc(
      doc(db, QR_SESSION_COLLECTION, sessionId),
      { status: 'expired' },
      { merge: true }
    );
  } catch (e) {
    console.warn('[QR Login] Error expiring session:', e);
  }
}

/**
 * Build the QR code content URL.
 * The QR code will encode a URL like: https://your-app.com?qr_session=SESSION_ID
 */
export function buildQRCodeUrl(sessionId: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?qr_session=${sessionId}`;
}

/**
 * Parse sessionId from a QR code URL.
 * Returns null if not a valid QR login URL.
 */
export function parseQRSessionId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('qr_session');
  } catch {
    // Maybe it's just a raw sessionId
    if (url && url.length === 36 && url.includes('-')) {
      return url;
    }
    return null;
  }
}
