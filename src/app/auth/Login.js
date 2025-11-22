import React, { useState } from "react";
import "./Login.css";
import AppLogo from "../../components/AppLogo/AppLogo";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";

const Login = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const email = e.target[0].value.trim();
    const password = e.target[1].value;

    try {
      // First check if the email belongs to an admin
      const adminQuery = query(
        collection(db, "admins"),
        where("email", "==", email)
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      
      if (adminSnapshot.empty) {
        throw new Error("Access denied. Admin account not found.");
      }

      // Proceed with Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verify the user is an admin in Firestore
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
      if (err.code === "auth/user-not-found") {
        setError("Admin account not found.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.message.includes("inactive")) {
        setError(err.message);
      } else if (err.message.includes("Access denied")) {
        setError(err.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResetLoading(true);

    if (!resetEmail) {
      setError("Please enter your email address.");
      setResetLoading(false);
      return;
    }

    try {
      // First verify the email belongs to an admin
      const adminQuery = query(
        collection(db, "admins"),
        where("email", "==", resetEmail)
      );
      
      const adminSnapshot = await getDocs(adminQuery);
      
      if (adminSnapshot.empty) {
        throw new Error("No admin account found with this email.");
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No admin account found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetSent(false);
    setError("");
    setSuccess("");
  };

  return (
    <>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <AppLogo />
            <h2>Sign In to Your Account</h2>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group email-input">
              <input 
                type="email" 
                placeholder="Admin Email" 
                required 
              />
            </div>
            <div className="input-group password-input">
              <input 
                type="password" 
                placeholder="Password" 
                required 
              />
            </div>

            <button 
              type="submit" 
              className={`login-btn ${loading ? 'loading' : ''}`} 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {error && !showForgotPassword && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && !showForgotPassword && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="login-footer">
            <a 
              className="forgot-password"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </a>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="forgot-password-modal">
          <div className="forgot-password-content">
            <button 
              className="close-modal"
              onClick={closeForgotPassword}
            >
              ×
            </button>
            
            <div className="forgot-password-header">
              <h3>Reset Your Password</h3>
              <p>
                Enter your admin email address and we'll send you a link to reset your password.
              </p>
            </div>

            {!resetSent ? (
              <form onSubmit={handleForgotPassword}>
                <div className="input-group email-input">
                  <input 
                    type="email" 
                    placeholder="Enter your admin email" 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required 
                  />
                </div>

                <button 
                  type="submit" 
                  className={`login-btn ${resetLoading ? 'loading' : ''}`} 
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="success-message">
                Check your email for password reset instructions!
              </div>
            )}

            {error && showForgotPassword && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="login-footer">
              <a 
                className="back-to-login"
                onClick={closeForgotPassword}
              >
                Back to Login
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;