import React, { useState, useEffect } from "react";
import "./App.css";
import Login from "./app/auth/Login";
import SuperDashboard from "./app/SuperAdmin/SuperDashboard";
import SubDashboard from "./app/SubAdmin/SubDashboard";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/firebaseConfig";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ role: "", name: "" });
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (persistent session)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, "admins", user.uid));
          if (userDoc.exists()) {
            const { role, name } = userDoc.data();
            setUserData({ role: role.toLowerCase(), name: name });
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setIsLoggedIn(false);
        setUserData({ role: "", name: "" });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Called after successful login in <Login />
  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUserData({
      role: userData.role.toLowerCase(),
      name: userData.name
    });
  };

  // Logout function
  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    setUserData({ role: "", name: "" });
  };

  if (loading) {
    return <div className="App">Loading...</div>;
  }

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : userData.role === "super" ? (
        <SuperDashboard userData={userData} onLogout={handleLogout} />
      ) : (
        <SubDashboard userData={userData} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;