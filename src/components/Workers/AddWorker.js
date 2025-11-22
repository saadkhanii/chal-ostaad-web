import React, { useState, useEffect } from 'react';
import './AddWorker.css';
import { collection, addDoc, getDocs, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';

const AddWorker = () => {
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    // Personal Information
    personalInfo: {
      name: '',
      phone: '',
      cnic: '',
      address: '',
      email: '',
      dateOfBirth: ''
    },
    // Work Information
    workInfo: {
      categoryId: '',
      skills: [],
      experience: '',
      serviceRadius: 10,
      availability: 'full-time',
      officeId: ''
    },
    // Verification
    verification: {
      status: 'pending',
      documents: []
    },
    // Admin who added this worker
    addedBy: {
      adminId: '',
      adminName: '',
      adminEmail: ''
    }
  });

  const [newSkill, setNewSkill] = useState('');

  // Fetch categories AND offices for dropdown and set admin info
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'workCategories'));
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    // Fetch offices
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

    // Set admin information
    const setAdminInfo = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          let adminName = 'Unknown Admin';
          
          if (adminDoc.exists()) {
            adminName = adminDoc.data().name || currentUser.displayName || currentUser.email || 'Unknown Admin';
          } else {
            adminName = currentUser.displayName || currentUser.email || 'Unknown Admin';
          }
          
          setFormData(prev => ({
            ...prev,
            addedBy: {
              adminId: currentUser.uid,
              adminName: adminName,
              adminEmail: currentUser.email || 'Unknown Email'
            }
          }));
        } catch (error) {
          console.error('Error fetching admin info:', error);
          setFormData(prev => ({
            ...prev,
            addedBy: {
              adminId: currentUser.uid,
              adminName: currentUser.displayName || currentUser.email || 'Unknown Admin',
              adminEmail: currentUser.email || 'Unknown Email'
            }
          }));
        }
      }
    };

    fetchCategories();
    fetchOffices();
    setAdminInfo();
  }, []);

  const handlePersonalInfoChange = (e) => {
    setFormData({
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleWorkInfoChange = (e) => {
    setFormData({
      ...formData,
      workInfo: {
        ...formData.workInfo,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.workInfo.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        workInfo: {
          ...formData.workInfo,
          skills: [...formData.workInfo.skills, newSkill.trim()]
        }
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      workInfo: {
        ...formData.workInfo,
        skills: formData.workInfo.skills.filter(skill => skill !== skillToRemove)
      }
    });
  };

  // Calculate age from date of birth
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!formData.personalInfo.name.trim()) {
      setMessage('❌ Worker name is required!');
      setLoading(false);
      return;
    }

    if (!formData.personalInfo.phone.trim()) {
      setMessage('❌ Phone number is required!');
      setLoading(false);
      return;
    }

    if (!formData.workInfo.categoryId) {
      setMessage('❌ Please select a work category!');
      setLoading(false);
      return;
    }

    // Office validation
    if (!formData.workInfo.officeId) {
      setMessage('❌ Please select an office for the worker!');
      setLoading(false);
      return;
    }

    // Age validation (must be at least 18 years old)
    if (formData.personalInfo.dateOfBirth) {
      const age = calculateAge(formData.personalInfo.dateOfBirth);
      if (age < 18) {
        setMessage('❌ Worker must be at least 18 years old!');
        setLoading(false);
        return;
      }
    }

    try {
      // Get selected office details
      const selectedOffice = offices.find(office => office.id === formData.workInfo.officeId);
      
      // Prepare worker data
      const workerData = {
        ...formData,
        officeInfo: {
          officeId: formData.workInfo.officeId,
          officeName: selectedOffice?.basicInfo?.name || 'Unknown Office',
          officeCity: selectedOffice?.basicInfo?.city || 'Unknown City'
        },
        ratings: {
          average: 0,
          totalReviews: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add worker to Firestore
      await addDoc(collection(db, 'workers'), workerData);

      setMessage('✅ Worker added successfully!');
      
      // Reset form (but keep admin info)
      setFormData({
        personalInfo: {
          name: '',
          phone: '',
          cnic: '',
          address: '',
          email: '',
          dateOfBirth: ''
        },
        workInfo: {
          categoryId: '',
          skills: [],
          experience: '',
          serviceRadius: 10,
          availability: 'full-time',
          officeId: ''
        },
        verification: {
          status: 'pending',
          documents: []
        },
        addedBy: formData.addedBy // Keep the same admin info
      });
      setNewSkill('');

    } catch (error) {
      console.error('Error adding worker:', error);
      setMessage('❌ Error adding worker: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.workInfo.categoryId);
  };

  const getSelectedOffice = () => {
    return offices.find(office => office.id === formData.workInfo.officeId);
  };

  // Calculate age for display
  const displayAge = formData.personalInfo.dateOfBirth 
    ? ` (${calculateAge(formData.personalInfo.dateOfBirth)} years old)`
    : '';

  return (
    <div className="add-worker-container">
      {/* REMOVED: Header since ContentDisplay handles it */}

      <form onSubmit={handleSubmit} className="add-worker-form">
        {/* Personal Information Section */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.personalInfo.name}
                onChange={handlePersonalInfoChange}
                required
                placeholder="Enter worker's full name"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.personalInfo.phone}
                onChange={handlePersonalInfoChange}
                required
                placeholder="+92 300 1234567"
              />
            </div>

            <div className="form-group">
              <label>CNIC Number</label>
              <input
                type="text"
                name="cnic"
                value={formData.personalInfo.cnic}
                onChange={handlePersonalInfoChange}
                placeholder="12345-6789012-3"
              />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.personalInfo.dateOfBirth}
                onChange={handlePersonalInfoChange}
                max={new Date().toISOString().split('T')[0]}
              />
              {formData.personalInfo.dateOfBirth && (
                <span className="age-display">{displayAge}</span>
              )}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.personalInfo.email}
                onChange={handlePersonalInfoChange}
                placeholder="worker@example.com"
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.personalInfo.address}
                onChange={handlePersonalInfoChange}
                placeholder="Full residential address"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Work Information Section */}
        <div className="form-section">
          <h3>Work Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Work Category *</label>
              <select
                name="categoryId"
                value={formData.workInfo.categoryId}
                onChange={handleWorkInfoChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Office Selection Field */}
            <div className="form-group">
              <label>Assigned Office *</label>
              <select
                name="officeId"
                value={formData.workInfo.officeId}
                onChange={handleWorkInfoChange}
                required
              >
                <option value="">Select an office</option>
                {offices.map(office => (
                  <option key={office.id} value={office.id}>
                    {office.basicInfo.name} - {office.basicInfo.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Service Radius (km)</label>
              <input
                type="number"
                name="serviceRadius"
                value={formData.workInfo.serviceRadius}
                onChange={handleWorkInfoChange}
                min="1"
                max="50"
                placeholder="10"
              />
            </div>

            <div className="form-group">
              <label>Availability</label>
              <select
                name="availability"
                value={formData.workInfo.availability}
                onChange={handleWorkInfoChange}
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
              </select>
            </div>

            <div className="form-group">
              <label>Experience</label>
              <input
                type="text"
                name="experience"
                value={formData.workInfo.experience}
                onChange={handleWorkInfoChange}
                placeholder="e.g., 5 years, Beginner, Expert"
              />
            </div>

            <div className="form-group full-width">
              <label>Skills</label>
              <div className="skills-input-group">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g., Wiring, Installation)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <button type="button" onClick={handleAddSkill} className="add-skill-btn">
                  Add Skill
                </button>
              </div>
              
              {formData.workInfo.skills.length > 0 && (
                <div className="skills-list">
                  {formData.workInfo.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSkill(skill)}
                        className="remove-skill"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Office Information Display */}
        {formData.workInfo.officeId && (
          <div className="form-section">
            <h3>Office Information</h3>
            <div className="office-info-display">
              <div className="office-info-item">
                <label>Selected Office:</label>
                <span>{getSelectedOffice()?.basicInfo?.name || 'Unknown'}</span>
              </div>
              <div className="office-info-item">
                <label>Location:</label>
                <span>{getSelectedOffice()?.basicInfo?.city || 'Unknown'}</span>
              </div>
              <div className="office-info-item">
                <label>Office Phone:</label>
                <span>{getSelectedOffice()?.basicInfo?.phone || 'Not available'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin Information Section */}
        <div className="form-section">
          <h3>Admin Information</h3>
          <div className="admin-info-display">
            <div className="admin-info-item">
              <label>Added By:</label>
              <span>{formData.addedBy.adminName}</span>
            </div>
            <div className="admin-info-item">
              <label>Admin Email:</label>
              <span>{formData.addedBy.adminEmail}</span>
            </div>
            <div className="admin-info-item">
              <label>Admin ID:</label>
              <span className="admin-id">{formData.addedBy.adminId}</span>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div className="form-section">
          <h3>Verification Status</h3>
          <div className="verification-info">
            <p>Worker will be added with <strong>Pending</strong> verification status.</p>
            <p>Documents can be uploaded later through the worker's profile.</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Adding Worker...' : 'Add Worker'}
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddWorker;