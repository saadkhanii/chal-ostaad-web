
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const googleProvider = new GoogleAuthProvider();

export async function signupWithEmail(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  // send verification
  await sendEmailVerification(userCredential.user);
  // optional: save profile to Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email: userCredential.user.email,
    createdAt: new Date().toISOString(),
  });
  return userCredential;
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  // optional: upsert user in Firestore
  const user = result.user;
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    name: user.displayName || null,
    lastLogin: new Date().toISOString(),
  }, { merge: true });
  return result;
}

export function logout() {
  return signOut(auth);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
