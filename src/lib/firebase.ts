import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Workspace Google Drive Scopes
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly'
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token in memory (never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token will be acquired on manual sign-in or pop-up
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || '';
    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Firestore Error Handler Requirement
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Drive Resource Firestore integration
export interface StoredDriveResource {
  id?: string;
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink?: string;
  sizeBytes?: number;
  ownerEmail?: string;
  eventId?: string;
  clubId?: string;
  uploadedAt: string;
}

export async function addDriveResource(resource: StoredDriveResource) {
  const collectionPath = 'drive_resources';
  try {
    const { addDoc, collection } = await import('firebase/firestore');
    const docRef = await addDoc(collection(db, collectionPath), {
      ...resource,
      uploadedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, collectionPath);
  }
}

export async function getDriveResources(eventId?: string) {
  const collectionPath = 'drive_resources';
  try {
    const { getDocs, collection, query, where } = await import('firebase/firestore');
    const q = eventId 
      ? query(collection(db, collectionPath), where('eventId', '==', eventId))
      : collection(db, collectionPath);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoredDriveResource));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, collectionPath);
  }
}

/**
 * Seed all initial campus events, clubs, and sample registrations directly into Cloud Firestore
 */
export async function seedInitialFirestoreData(
  eventsList: any[],
  clubsList: any[],
  registrationsList: any[]
): Promise<{ success: boolean; eventsCount: number; clubsCount: number; registrationsCount: number; errors: string[] }> {
  const { setDoc, doc } = await import('firebase/firestore');
  const errors: string[] = [];
  let eventsCount = 0;
  let clubsCount = 0;
  let registrationsCount = 0;

  // 1. Seed Clubs
  for (const club of clubsList) {
    try {
      const cleanClub = {
        name: club.name || 'Student Club',
        category: club.category || 'Technical',
        description: club.description || '',
        logo: club.logo || '',
        bannerImage: club.bannerImage || '',
        leadName: club.leadName || '',
        leadEmail: club.leadEmail || 'student@mitsgwl.ac.in',
        leadPhone: club.leadPhone || '',
        facultyAdvisor: club.facultyAdvisor || '',
        memberCount: typeof club.memberCount === 'number' ? club.memberCount : 25,
        eventsHosted: typeof club.eventsHosted === 'number' ? club.eventsHosted : 3,
        foundedYear: typeof club.foundedYear === 'number' ? club.foundedYear : 2020,
        isVerified: Boolean(club.isVerified)
      };
      await setDoc(doc(db, 'clubs', club.id || `club-${Date.now()}`), cleanClub, { merge: true });
      clubsCount++;
    } catch (err: any) {
      console.warn('Club seed error:', club.id, err);
      errors.push(`Club ${club.name}: ${err?.message || err}`);
    }
  }

  // 2. Seed Events
  for (const ev of eventsList) {
    try {
      const cleanEvent = {
        title: ev.title || 'MITS University Event',
        tagline: ev.tagline || '',
        description: ev.description || '',
        clubId: ev.clubId || 'club-iste',
        clubName: ev.clubName || 'ISTE Students Chapter MITS',
        clubLogo: ev.clubLogo || '',
        category: ev.category || 'Workshop',
        coverImage: ev.coverImage || '',
        startDate: ev.startDate || '2025-10-15',
        startTime: ev.startTime || '10:00 AM',
        endDate: ev.endDate || ev.startDate || '2025-10-15',
        endTime: ev.endTime || '01:00 PM',
        venue: ev.venue || 'MITS Central Auditorium',
        isOnline: Boolean(ev.isOnline),
        meetingLink: ev.meetingLink || '',
        capacity: typeof ev.capacity === 'number' ? ev.capacity : 100,
        registeredCount: typeof ev.registeredCount === 'number' ? ev.registeredCount : 0,
        status: ['upcoming', 'ongoing', 'completed', 'cancelled'].includes(ev.status) ? ev.status : 'upcoming',
        contactEmail: ev.contactEmail || 'events@mitsgwl.ac.in',
        createdBy: auth.currentUser?.uid || 'admin',
        createdAt: ev.createdAt || new Date().toISOString()
      };
      await setDoc(doc(db, 'events', ev.id || `evt-${Date.now()}`), cleanEvent, { merge: true });
      eventsCount++;
    } catch (err: any) {
      console.warn('Event seed error:', ev.id, err);
      errors.push(`Event ${ev.title}: ${err?.message || err}`);
    }
  }

  // 3. Seed Registrations
  for (const reg of registrationsList) {
    try {
      const cleanReg = {
        eventId: reg.eventId || 'evt-1',
        userId: auth.currentUser?.uid || reg.userId || 'user-student-1',
        userName: reg.userName || 'Student Attendee',
        userEmail: reg.userEmail || 'student@mitsgwl.ac.in',
        studentId: reg.studentId || '0901CS221089',
        phone: reg.phone || '',
        department: reg.department || 'Computer Science & Engineering',
        year: reg.year || '3rd Year',
        ticketCode: reg.ticketCode || `MITS-${Math.floor(100000 + Math.random() * 900000)}`,
        registeredAt: reg.registeredAt || new Date().toISOString(),
        status: ['confirmed', 'checked_in', 'cancelled'].includes(reg.status) ? reg.status : 'confirmed'
      };
      await setDoc(doc(db, 'registrations', reg.id || `reg-${Date.now()}`), cleanReg, { merge: true });
      registrationsCount++;
    } catch (err: any) {
      console.warn('Registration seed error:', reg.id, err);
      errors.push(`Registration ${reg.ticketCode}: ${err?.message || err}`);
    }
  }

  return {
    success: errors.length === 0,
    eventsCount,
    clubsCount,
    registrationsCount,
    errors
  };
}

