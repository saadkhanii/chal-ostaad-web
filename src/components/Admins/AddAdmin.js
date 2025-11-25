import React, { useState, useEffect } from 'react';
import './AddAdmin.css';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';

const AddAdmin = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'sub',
    phone: '',
    cnic: '',
    assignedOffice: '',
    permissions: {
      workers: true,
      offices: false,
      categories: false,
      disputes: false,
      reviews: false
    },
    password: '',
    confirmPassword: ''
  });
  const [offices, setOffices] = useState([]);
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch offices for assignment
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'offices'));
        const officesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOffices(officesData);
      } catch (error) {
        console.error('Error fetching offices:', error);
      }
    };

    fetchOffices();
  }, []);

  // Format name to capitalize first letters
  const formatName = (name) => {
    return name.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  // Format phone number to Pakistan format: 03xx-xxxxxxx
  const formatPhone = (phone) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    }
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 11)}`;
  };

  // Format CNIC to Pakistan format: xxxxx-xxxxxxx-x
  const formatCNIC = (cnic) => {
    const numbers = cnic.replace(/\D/g, '');
    if (numbers.length <= 5) {
      return numbers;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    } else if (numbers.length <= 13) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12)}`;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('permission_')) {
      const permissionName = name.replace('permission_', '');
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionName]: checked
        }
      }));
    } else {
      let formattedValue = value;

      // Apply formatting based on field type
      if (name === 'name') {
        formattedValue = formatName(value);
      } else if (name === 'phone') {
        formattedValue = formatPhone(value);
      } else if (name === 'cnic') {
        formattedValue = formatCNIC(value);
      }

      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    }
  };

  const handlePasswordPrompt = (e) => {
    setCurrentAdminPassword(e.target.value);
  };

  const handlePermissionToggle = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const validateForm = () => {
    // Phone validation for Pakistan format
    const phoneRegex = /^03\d{2}-\d{7}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      setMessage('❌ Please enter a valid Pakistan phone number (03xx-xxxxxxx)');
      return false;
    }

    // CNIC validation for Pakistan format
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (formData.cnic && !cnicRegex.test(formData.cnic)) {
      setMessage('❌ Please enter a valid Pakistan CNIC (xxxxx-xxxxxxx-x)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First, prompt for current admin password
    if (!showPasswordPrompt) {
      setShowPasswordPrompt(true);
      return;
    }

    setLoading(true);
    setMessage('');

    const creatorUid = auth.currentUser.uid;
    const creatorEmail = auth.currentUser.email;

    // Enhanced validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwords do not match!');
      setLoading(false);
      setShowPasswordPrompt(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage('❌ Password must be at least 6 characters!');
      setLoading(false);
      setShowPasswordPrompt(false);
      return;
    }

    if (!currentAdminPassword) {
      setMessage('❌ Please enter your current password to continue');
      setLoading(false);
      return;
    }

    // Validate phone and CNIC formats
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    // Role-based validation
    if (formData.role === 'sub' && !formData.assignedOffice) {
      setMessage('❌ Sub Admin must be assigned to an office!');
      setLoading(false);
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      // Get assigned office details and format office name
      const assignedOffice = offices.find(office => office.id === formData.assignedOffice);
      const officeName = assignedOffice?.basicInfo?.name ? formatName(assignedOffice.basicInfo.name) : 'Not assigned';
      const officeCity = assignedOffice?.basicInfo?.city ? formatName(assignedOffice.basicInfo.city) : 'Not assigned';

      // 2. Create comprehensive admin document in Firestore
      await setDoc(doc(db, 'admins', user.uid), {
        name: formData.name, // Already formatted by handleChange
        email: formData.email,
        role: formData.role,
        phone: formData.phone, // Already formatted by handleChange
        cnic: formData.cnic, // Already formatted by handleChange
        assignedOffice: {
          officeId: formData.assignedOffice,
          officeName: officeName,
          officeCity: officeCity
        },
        permissions: formData.permissions,
        status: 'active',
        createdAt: new Date(),
        createdBy: {
          adminId: creatorUid,
          adminEmail: creatorEmail,
          timestamp: new Date()
        },
        lastLogin: null,
        loginCount: 0
      });

      // 3. Re-login original admin
      await signInWithEmailAndPassword(auth, creatorEmail, currentAdminPassword);

      setMessage('✅ Admin created successfully! You have been re-logged in.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'sub',
        phone: '',
        cnic: '',
        assignedOffice: '',
        permissions: {
          workers: true,
          offices: false,
          categories: false,
          disputes: false,
          reviews: false
        },
        password: '',
        confirmPassword: ''
      });
      setCurrentAdminPassword('');
      setShowPasswordPrompt(false);

    } catch (error) {
      console.error('Error creating admin:', error);
      
      // Try to re-login original admin
      try {
        await signInWithEmailAndPassword(auth, creatorEmail, currentAdminPassword);
      } catch (reloginError) {
        console.error('Re-login failed:', reloginError);
      }

      if (error.code === 'auth/email-already-in-use') {
        setMessage('❌ Email already exists! Please use a different email.');
      } else if (error.code === 'auth/wrong-password') {
        setMessage('❌ Current password is incorrect! Please try again.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('❌ Password is too weak! Please use a stronger password.');
      } else {
        setMessage('❌ Error creating admin: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelCreation = () => {
    setShowPasswordPrompt(false);
    setCurrentAdminPassword('');
    setMessage('');
  };

  return (
    <div className="add-admin-container">
      <form onSubmit={handleSubmit} className="add-admin-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={showPasswordPrompt}
                placeholder="Enter admin's full name"
              />
              <small>Name will be automatically capitalized</small>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={showPasswordPrompt}
                placeholder="admin@chalostaad.com"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={showPasswordPrompt}
                placeholder="03xx-xxxxxxx"
                maxLength="12"
              />
              <small>Pakistan format: 03xx-xxxxxxx</small>
            </div>

            <div className="form-group">
              <label>CNIC Number</label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                disabled={showPasswordPrompt}
                placeholder="xxxxx-xxxxxxx-x"
                maxLength="15"
              />
              <small>Pakistan CNIC format: xxxxx-xxxxxxx-x</small>
            </div>

            <div className="form-group">
              <label>Admin Role *</label>
              <select name="role" value={formData.role} onChange={handleChange} disabled={showPasswordPrompt}>
                <option value="sub">Sub Administrator</option>
                <option value="super">Super Administrator</option>
              </select>
              <small className="role-description">
                {formData.role === 'super' 
                  ? 'Full system access and management rights' 
                  : 'Limited access based on assigned permissions'
                }
              </small>
            </div>
          </div>
        </div>

        {/* Office Assignment Section */}
        {formData.role === 'sub' && (
          <div className="form-section">
            <h3>Office Assignment</h3>
            <div className="form-group">
              <label>Assign to Office *</label>
              <select 
                name="assignedOffice" 
                value={formData.assignedOffice} 
                onChange={handleChange} 
                disabled={showPasswordPrompt}
                required
              >
                <option value="">Select an office</option>
                {offices.map(office => (
                  <option key={office.id} value={office.id}>
                    {office.basicInfo.name ? formatName(office.basicInfo.name) : 'Unnamed Office'} - {office.basicInfo.city ? formatName(office.basicInfo.city) : 'Unknown City'}
                  </option>
                ))}
              </select>
              <small>Sub admins must be assigned to a specific office</small>
            </div>
          </div>
        )}

        {/* Permissions Section */}
        <div className="form-section">
          <h3>System Permissions</h3>
          <div className="permissions-grid">
            <div className="permission-item">
              <label className="permission-checkbox">
                <input
                  type="checkbox"
                  name="permission_workers"
                  checked={formData.permissions.workers}
                  onChange={handleChange}
                  disabled={showPasswordPrompt}
                />
                <span className="checkmark"></span>
                <div className="permission-info">
                  <span className="permission-name">Workers Management</span>
                  <span className="permission-desc">View and manage workers</span>
                </div>
              </label>
            </div>

            <div className="permission-item">
              <label className="permission-checkbox">
                <input
                  type="checkbox"
                  name="permission_offices"
                  checked={formData.permissions.offices}
                  onChange={handleChange}
                  disabled={showPasswordPrompt}
                />
                <span className="checkmark"></span>
                <div className="permission-info">
                  <span className="permission-name">Offices Access</span>
                  <span className="permission-desc">View office information</span>
                </div>
              </label>
            </div>

            <div className="permission-item">
              <label className="permission-checkbox">
                <input
                  type="checkbox"
                  name="permission_categories"
                  checked={formData.permissions.categories}
                  onChange={handleChange}
                  disabled={showPasswordPrompt}
                />
                <span className="checkmark"></span>
                <div className="permission-info">
                  <span className="permission-name">Categories Access</span>
                  <span className="permission-desc">View work categories</span>
                </div>
              </label>
            </div>

            <div className="permission-item">
              <label className="permission-checkbox">
                <input
                  type="checkbox"
                  name="permission_disputes"
                  checked={formData.permissions.disputes}
                  onChange={handleChange}
                  disabled={showPasswordPrompt}
                />
                <span className="checkmark"></span>
                <div className="permission-info">
                  <span className="permission-name">Disputes Management</span>
                  <span className="permission-desc">Handle customer disputes</span>
                </div>
              </label>
            </div>

            <div className="permission-item">
              <label className="permission-checkbox">
                <input
                  type="checkbox"
                  name="permission_reviews"
                  checked={formData.permissions.reviews}
                  onChange={handleChange}
                  disabled={showPasswordPrompt}
                />
                <span className="checkmark"></span>
                <div className="permission-info">
                  <span className="permission-name">Reviews Management</span>
                  <span className="permission-desc">Moderate customer reviews</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="form-section">
          <h3>Security Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={showPasswordPrompt}
                placeholder="Minimum 6 characters"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={showPasswordPrompt}
                placeholder="Re-enter password"
                minLength="6"
              />
            </div>
          </div>
        </div>

        {/* Password Prompt Section */}
        {showPasswordPrompt && (
          <div className="form-section password-prompt-section">
            <h3>Security Verification</h3>
            <div className="security-notice">
              <div className="security-icon">🔒</div>
              <div className="security-text">
                <h4>Security Check Required</h4>
                <p>For security purposes, please enter your current password to confirm this action.</p>
              </div>
            </div>
            <div className="form-group">
              <label>Your Current Password *</label>
              <input
                type="password"
                value={currentAdminPassword}
                onChange={handlePasswordPrompt}
                required
                placeholder="Enter your current password"
                autoFocus
              />
            </div>
            <div className="security-actions">
              <button type="submit" disabled={loading} className="submit-btn confirm-btn">
                {loading ? 'Creating Admin...' : 'Confirm & Create Admin'}
              </button>
              <button type="button" onClick={cancelCreation} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Submit Button (only show when not in password prompt) */}
        {!showPasswordPrompt && (
          <div className="form-actions">
            <button type="submit" className="submit-btn primary-btn">
              Create Administrator
            </button>
          </div>
        )}

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddAdmin;