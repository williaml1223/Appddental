import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const firebaseConfig = (!config.apiKey || config.apiKey === 'placeholder') 
  ? null 
  : config;

if (!firebaseConfig) {
  console.warn('Firebase configuration is missing or using placeholders. Some features may not work.');
}

const app = getApps().length === 0 
  ? initializeApp(firebaseConfig || { apiKey: 'none', projectId: 'none' }) 
  : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app, (config as any).firestoreDatabaseId); 
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in:', error);
  }
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
