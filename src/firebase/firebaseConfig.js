// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUrlPKeXYSz8R-Qt4YJfS302bQKCNyo9k",
  authDomain: "chalostaad.firebaseapp.com",
  projectId: "chalostaad",
  storageBucket: "chalostaad.firebasestorage.app",
  messagingSenderId: "1017752508261",
  appId: "1:1017752508261:web:003434bd89db2839eaf38c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
