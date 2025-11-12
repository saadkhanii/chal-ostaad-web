import React, { useState } from "react";
import "./Login.css";
import AppLogo from "../../components/AppLogo/AppLogo";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = e.target[0].value.trim();
    const password = e.target[1].value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "admins", user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("User not found or unauthorized.");
      }

      const { role, name, status } = userDoc.data();

      // Check if admin is active
      if (status !== 'active') {
        await signOut(auth);
        throw new Error("Your account is inactive. Please contact super admin.");
      }

      if (onLoginSuccess) {
        onLoginSuccess({
          role: role,
          name: name
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") setError("User not found.");
      else if (err.code === "auth/wrong-password") setError("Incorrect password.");
      else if (err.message.includes("inactive")) setError(err.message);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <AppLogo />
          <h2>Sign In to Your Account</h2>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input type="email" placeholder="Email" required />
          </div>
          <div className="input-group">
            <input type="password" placeholder="Password" required />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && (
          <div className="error-message" style={{ color: "red", marginTop: "10px" }}>
            {error}
          </div>
        )}

        <div className="login-footer">
          <a href="#">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;