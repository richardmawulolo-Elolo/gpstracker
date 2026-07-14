import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithCredential } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
import { ref, set, get } from 'firebase/database';
import { database } from './firebase';

// Initialize Firebase Auth
const auth = getAuth();

export type UserRole = 'caretaker' | 'patient';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
}

/**
 * Sign up a new user with email/password and assign a role.
 * If the user already exists in Auth but not in the DB (orphaned account),
 * this will sign them in and write the missing profile.
 */
export async function signUp(email: string, password: string, role: UserRole): Promise<AppUser> {
  let uid: string;
  let userEmail: string;

  try {
    // Try creating a new account
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    uid = credential.user.uid;
    userEmail = credential.user.email || email;
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      // Account exists in Auth — sign in instead and write the missing profile
      const credential = await signInWithEmailAndPassword(auth, email, password);
      uid = credential.user.uid;
      userEmail = credential.user.email || email;
    } else {
      throw err;
    }
  }

  // Write/overwrite the user profile with the selected role
  await set(ref(database, `users/${uid}`), {
    email: userEmail,
    role,
    createdAt: new Date().toISOString(),
  });

  // If signing up as a patient, initialize the patient data node
  if (role === 'patient') {
    const patientSnapshot = await get(ref(database, `patients/${uid}`));
    if (!patientSnapshot.exists()) {
      const emailPrefix = userEmail.split('@')[0];
      const defaultName = emailPrefix.split(/[\.\-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      await set(ref(database, `patients/${uid}`), {
        name: defaultName,
        location: { latitude: 5.3520, longitude: -0.6230 },
        isWandering: false,
        hasFall: false,
        hasSOS: false,
        batteryLevel: 100,
        signalStrength: 'Excellent',
      });
    }
  }

  return { uid, email: userEmail, role };
}

/**
 * Sign in an existing user with email/password.
 * Fetches the stored role from the database.
 * If profile is missing, throws a descriptive error so the user can sign up instead.
 */
export async function signIn(email: string, password: string): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Fetch role from database
  const snapshot = await get(ref(database, `users/${user.uid}`));
  const data = snapshot.val();

  if (!data || !data.role) {
    // Sign out so they don't get stuck in a logged-in state without a role
    await firebaseSignOut(auth);
    throw new Error('No role assigned yet. Please use "Create Account" to select your role.');
  }

  return { uid: user.uid, email: user.email || email, role: data.role };
}

/**
 * Sign in with Google popup.
 * If a role is provided (from signup page), it writes the profile.
 * If no role is provided (from login page), it fetches the existing profile.
 */
export async function signInWithGoogle(role?: UserRole): Promise<AppUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user profile already exists
  const snapshot = await get(ref(database, `users/${user.uid}`));
  const data = snapshot.val();

  if (data && data.role) {
    // Existing user — return their stored role
    return { uid: user.uid, email: user.email || '', role: data.role };
  }

  if (!role) {
    // No profile and no role provided (login page) — sign out and ask them to use signup
    await firebaseSignOut(auth);
    throw new Error('No role assigned yet. Please use "Create Account" to select your role first.');
  }

  // New user with role from signup — write profile
  await set(ref(database, `users/${user.uid}`), {
    email: user.email,
    role,
    createdAt: new Date().toISOString(),
  });

  // If patient, initialize patient data
  if (role === 'patient') {
    const patientSnapshot = await get(ref(database, `patients/${user.uid}`));
    if (!patientSnapshot.exists()) {
      await set(ref(database, `patients/${user.uid}`), {
        name: user.displayName || 'Patient',
        location: { latitude: 5.3520, longitude: -0.6230 },
        isWandering: false,
        hasFall: false,
        hasSOS: false,
        batteryLevel: 100,
        signalStrength: 'Excellent',
      });
    }
  }

  return { uid: user.uid, email: user.email || '', role };
}

/**
 * Sign in with Google using an ID token (from native Expo AuthSession).
 * If a role is provided (from signup page), it writes the profile.
 * If no role is provided (from login page), it fetches the existing profile.
 */
export async function signInWithGoogleNative(idToken: string, role?: UserRole): Promise<AppUser> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const user = result.user;

  // Check if user profile already exists
  const snapshot = await get(ref(database, `users/${user.uid}`));
  const data = snapshot.val();

  if (data && data.role) {
    // Existing user — return their stored role
    return { uid: user.uid, email: user.email || '', role: data.role };
  }

  if (!role) {
    // No profile and no role provided (login page) — sign out and ask them to use signup
    await firebaseSignOut(auth);
    throw new Error('No role assigned yet. Please use "Create Account" to select your role first.');
  }

  // New user with role from signup — write profile
  await set(ref(database, `users/${user.uid}`), {
    email: user.email,
    role,
    createdAt: new Date().toISOString(),
  });

  // If patient, initialize patient data
  if (role === 'patient') {
    const patientSnapshot = await get(ref(database, `patients/${user.uid}`));
    if (!patientSnapshot.exists()) {
      await set(ref(database, `patients/${user.uid}`), {
        name: user.displayName || 'Patient',
        location: { latitude: 5.3520, longitude: -0.6230 },
        isWandering: false,
        hasFall: false,
        hasSOS: false,
        batteryLevel: 100,
        signalStrength: 'Excellent',
      });
    }
  }

  return { uid: user.uid, email: user.email || '', role };
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { auth };
