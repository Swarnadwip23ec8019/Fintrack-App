import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace this with your own Firebase project configuration!
// You can get this by going to the Firebase Console -> Project Settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "AIzaSyC6wmofPWDVzkgUMS7GZlqWMgV5380zS4o",
  authDomain: "fintrack-bbbc5.firebaseapp.com",
  projectId: "fintrack-bbbc5",
  storageBucket: "fintrack-bbbc5.firebasestorage.app",
  messagingSenderId: "8304059461",
  appId: "1:8304059461:web:dda9a224ed765a48c76f2c",
  measurementId: "G-2VEXT3XZX1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication and Database
export const auth = getAuth(app);
export const db = getFirestore(app);
