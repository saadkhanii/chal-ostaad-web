import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext({ user: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Persist login across sessions
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Check if user exists in admins collection and is active
          const adminDocRef = doc(db, "admins", currentUser.uid);
          const adminDoc = await getDoc(adminDocRef);

          if (!adminDoc.exists()) {
            // User is not an admin, sign them out
            console.log("User not found in admins collection, signing out...");
            await signOut(auth);
            setUser(null);
            setLoading(false);
            return;
          }

          const adminData = adminDoc.data();

          // Check if admin is active
          if (adminData.status !== 'active') {
            // Admin is inactive, sign them out
            console.log("Admin account is inactive, signing out...");
            await signOut(auth);
            setUser(null);
            setLoading(false);
            return;
          }

          // User is valid active admin, set user with admin data
          setUser({
            ...currentUser,
            role: adminData.role,
            name: adminData.name,
            status: adminData.status
          });
          
        } catch (error) {
          console.error("Error checking admin status:", error);
          // If there's an error checking admin status, sign out for security
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = { user, loading };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}