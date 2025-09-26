// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB3B7R8TXBv6fII_TwzZ483zIxps-8IJMQ",
  authDomain: "inventorypro-4d47e.firebaseapp.com",
  projectId: "inventorypro-4d47e",
  storageBucket: "inventorypro-4d47e.firebasestorage.app",
  messagingSenderId: "15180332766",
  appId: "1:15180332766:web:9b264cbdc0364470c68c4f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;