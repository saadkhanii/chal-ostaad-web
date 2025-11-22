import React, { useState, useEffect } from 'react';
import './ManageWorkers.css';
import { collection, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ManageWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOffice, setFilterOffice] = useState('all');
  const [editingWorker, setEditingWorker] = useState(null);
  const [editForm, setEditForm] = useState({
    personalInfo: {
      name: '',
      phone: '',
      email: '',
      address: '',
      dateOfBirth: ''
    },
    workInfo: {
      categoryId: '',
      skills: [],
      experience: '',
      serviceRadius: 10,
      availability: 'full-time',
      officeId: ''
    }
  });
  const [newSkill, setNewSkill] = useState('');

  // Fetch workers, categories, and offices in real-time
  useEffect(() => {
    const workersUnsubscribe = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkers(workersData);
    });

    const categoriesUnsubscribe = onSnapshot(collection(db, 'workCategories'), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    });

    const officesUnsubscribe = onSnapshot(collection(db, 'offices'), (snapshot) => {
      const officesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOffices(officesData);
    });

    return () => {
      workersUnsubscribe();
      categoriesUnsubscribe();
      officesUnsubscribe();
    };
  }, []);

  // Filter workers based on search and filters
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.personalInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.personalInfo?.phone?.includes(searchTerm) ||
                         worker.personalInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || worker.workInfo?.categoryId === filterCategory;
    const matchesStatus = filterStatus === 'all' || worker.verification?.status === filterStatus;
    const matchesOffice = filterOffice === 'all' || worker.workInfo?.officeId === filterOffice;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesOffice;
  });

  // Calculate statistics
  const totalWorkers = workers.length;
  const verifiedWorkers = workers.filter(w => w.verification?.status === 'verified').length;
  const pendingWorkers = workers.filter(w => w.verification?.status === 'pending').length;
  const totalCategories = categories.length;

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? `${category.icon} ${category.name}` : 'Unknown Category';
  };

  // Get office name by ID
  const getOfficeName = (officeId) => {
    const office = offices.find(off => off.id === officeId);
    return office ? office.basicInfo?.name : 'Unknown Office';
  };

  // Calculate age from date of birth
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Unknown';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Start editing a worker
  const startEdit = (worker) => {
    setEditingWorker(worker.id);
    setEditForm({
      personalInfo: {
        name: worker.personalInfo?.name || '',
        phone: worker.personalInfo?.phone || '',
        email: worker.personalInfo?.email || '',
        address: worker.personalInfo?.address || '',
        dateOfBirth: worker.personalInfo?.dateOfBirth || ''
      },
      workInfo: {
        categoryId: worker.workInfo?.categoryId || '',
        skills: [...(worker.workInfo?.skills || [])],
        experience: worker.workInfo?.experience || '',
        serviceRadius: worker.workInfo?.serviceRadius || 10,
        availability: worker.workInfo?.availability || 'full-time',
        officeId: worker.workInfo?.officeId || ''
      }
    });
    setNewSkill('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingWorker(null);
    setEditForm({
      personalInfo: { name: '', phone: '', email: '', address: '', dateOfBirth: '' },
      workInfo: { categoryId: '', skills: [], experience: '', serviceRadius: 10, availability: 'full-time', officeId: '' }
    });
    setNewSkill('');
  };

  // Handle form field changes
  const handlePersonalInfoChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [e.target.name]: e.target.value
      }
    }));
  };

  const handleWorkInfoChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      workInfo: {
        ...prev.workInfo,
        [e.target.name]: e.target.value
      }
    }));
  };

  // Skills management
  const handleAddSkill = () => {
    if (newSkill.trim() && !editForm.workInfo.skills.includes(newSkill.trim())) {
      setEditForm(prev => ({
        ...prev,
        workInfo: {
          ...prev.workInfo,
          skills: [...prev.workInfo.skills, newSkill.trim()]
        }
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditForm(prev => ({
      ...prev,
      workInfo: {
        ...prev.workInfo,
        skills: prev.workInfo.skills.filter(skill => skill !== skillToRemove)
      }
    }));
  };

  const handleServiceAreaKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Update worker
  const updateWorker = async (workerId) => {
    try {
      const updateData = {
        'personalInfo.name': editForm.personalInfo.name,
        'personalInfo.phone': editForm.personalInfo.phone,
        'personalInfo.email': editForm.personalInfo.email,
        'personalInfo.address': editForm.personalInfo.address,
        'personalInfo.dateOfBirth': editForm.personalInfo.dateOfBirth,
        'workInfo.categoryId': editForm.workInfo.categoryId,
        'workInfo.skills': editForm.workInfo.skills,
        'workInfo.experience': editForm.workInfo.experience,
        'workInfo.serviceRadius': parseInt(editForm.workInfo.serviceRadius) || 10,
        'workInfo.availability': editForm.workInfo.availability,
        'workInfo.officeId': editForm.workInfo.officeId,
        'updatedAt': new Date()
      };

      await updateDoc(doc(db, 'workers', workerId), updateData);
      setEditingWorker(null);
      alert('✅ Worker updated successfully!');
    } catch (error) {
      console.error('Error updating worker:', error);
      alert('❌ Error updating worker: ' + error.message);
    }
  };

  // Delete worker (with confirmation)
  const handleDeleteWorker = async (workerId, workerName) => {
    if (!window.confirm(`Are you sure you want to delete worker "${workerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'workers', workerId));
      alert('✅ Worker deleted successfully!');
    } catch (error) {
      console.error('Error deleting worker:', error);
      alert('❌ Error deleting worker: ' + error.message);
    }
  };

  // Toggle verification status
  const toggleVerificationStatus = async (workerId, currentStatus) => {
    const newStatus = currentStatus === 'verified' ? 'pending' : 'verified';
    
    try {
      await updateDoc(doc(db, 'workers', workerId), {
        'verification.status': newStatus,
        'updatedAt': new Date()
      });
    } catch (error) {
      console.error('Error updating worker status:', error);
      alert('❌ Error updating worker status: ' + error.message);
    }
  };

  return (
    <div className="manage-workers-container">
      {/* REMOVED: Header since ContentDisplay handles it */}

      {/* Enhanced Statistics */}
      <div className="workers-stats">
        <div className="stat-card total-workers">
          <div className="stat-icon">👷</div>
          <div className="stat-content">
            <div className="stat-number">{totalWorkers}</div>
            <div className="stat-label">Total Workers</div>
          </div>
        </div>
        
        <div className="stat-card verified-workers">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{verifiedWorkers}</div>
            <div className="stat-label">Verified Workers</div>
          </div>
        </div>
        
        <div className="stat-card pending-workers">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{pendingWorkers}</div>
            <div className="stat-label">Pending Verification</div>
          </div>
        </div>
        
        <div className="stat-card total-categories">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-number">{totalCategories}</div>
            <div className="stat-label">Service Categories</div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search Workers</label>
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Office</label>
            <select 
              value={filterOffice} 
              onChange={(e) => setFilterOffice(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Offices</option>
              {offices.map(office => (
                <option key={office.id} value={office.id}>
                  {office.basicInfo?.name} - {office.basicInfo?.city}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>&nbsp;</label>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterOffice('all');
              }} 
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="results-count">
          Showing {filteredWorkers.length} of {workers.length} workers
        </div>
      </div>

      {/* Enhanced Workers Grid */}
      {filteredWorkers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Workers Found</h3>
          <p>Try adjusting your search criteria or filters</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('all');
              setFilterStatus('all');
              setFilterOffice('all');
            }} 
            className="clear-filters-btn"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="workers-grid">
          {filteredWorkers.map(worker => {
            const initials = worker.personalInfo?.name
              ?.split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'WW';
            
            const age = worker.personalInfo?.dateOfBirth ? calculateAge(worker.personalInfo.dateOfBirth) : 'Unknown';
            
            return (
              <div key={worker.id} className="worker-card">
                <div className="worker-header">
                  <div className="worker-avatar">{initials}</div>
                  <div className="worker-basic-info">
                    <h3 className="worker-name">{worker.personalInfo?.name || 'Unknown Worker'}</h3>
                    <p className="worker-phone">{worker.personalInfo?.phone || 'No phone'}</p>
                    <p className="worker-email">{worker.personalInfo?.email || 'No email'}</p>
                  </div>
                  <span className={`status-badge status-${worker.verification?.status || 'pending'}`}>
                    {worker.verification?.status || 'pending'}
                  </span>
                </div>

                <div className="worker-details">
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">
                      {getCategoryName(worker.workInfo?.categoryId)}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Experience</span>
                    <span className="detail-value">
                      {worker.workInfo?.experience || 'Not specified'}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Skills</span>
                    <div className="skills-preview">
                      {worker.workInfo?.skills?.slice(0, 2).map((skill, index) => (
                        <span key={index} className="skill-tag small">
                          {skill}
                        </span>
                      ))}
                      {worker.workInfo?.skills?.length > 2 && (
                        <span className="more-skills">
                          +{worker.workInfo.skills.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Service Radius</span>
                    <span className="detail-value">
                      {worker.workInfo?.serviceRadius || 10} km
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Age</span>
                    <span className="detail-value">{age} years</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="detail-label">Added By</span>
                    <span className="detail-value admin-name">
                      {worker.addedBy?.adminName || 'System'}
                    </span>
                  </div>
                </div>

                <div className="worker-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => startEdit(worker)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className={`action-btn status-btn ${worker.verification?.status === 'verified' ? 'unverify' : 'verify'}`}
                    onClick={() => toggleVerificationStatus(worker.id, worker.verification?.status || 'pending')}
                  >
                    {worker.verification?.status === 'verified' ? '⏸️ Unverify' : '✅ Verify'}
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteWorker(worker.id, worker.personalInfo?.name)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingWorker && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Worker</h3>
              <button className="close-btn" onClick={cancelEdit}>×</button>
            </div>
            <div className="modal-body">
              {/* Personal Information */}
              <div className="form-section">
                <h4>Personal Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.personalInfo.name}
                      onChange={handlePersonalInfoChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.personalInfo.phone}
                      onChange={handlePersonalInfoChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.personalInfo.email}
                      onChange={handlePersonalInfoChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={editForm.personalInfo.dateOfBirth}
                      onChange={handlePersonalInfoChange}
                      className="form-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={editForm.personalInfo.address}
                      onChange={handlePersonalInfoChange}
                      className="form-input"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="form-section">
                <h4>Work Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="categoryId"
                      value={editForm.workInfo.categoryId}
                      onChange={handleWorkInfoChange}
                      className="form-input"
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
                  <div className="form-group">
                    <label>Office *</label>
                    <select
                      name="officeId"
                      value={editForm.workInfo.officeId}
                      onChange={handleWorkInfoChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select an office</option>
                      {offices.map(office => (
                        <option key={office.id} value={office.id}>
                          {office.basicInfo?.name} - {office.basicInfo?.city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Service Radius (km)</label>
                    <input
                      type="number"
                      name="serviceRadius"
                      value={editForm.workInfo.serviceRadius}
                      onChange={handleWorkInfoChange}
                      className="form-input"
                      min="1"
                      max="50"
                    />
                  </div>
                  <div className="form-group">
                    <label>Availability</label>
                    <select
                      name="availability"
                      value={editForm.workInfo.availability}
                      onChange={handleWorkInfoChange}
                      className="form-input"
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
                      value={editForm.workInfo.experience}
                      onChange={handleWorkInfoChange}
                      className="form-input"
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
                        onKeyPress={handleServiceAreaKeyPress}
                        className="form-input"
                        placeholder="Add a skill (e.g., Wiring, Installation)"
                      />
                      <button 
                        type="button" 
                        onClick={handleAddSkill} 
                        className="add-skill-btn"
                      >
                        Add Skill
                      </button>
                    </div>
                    
                    {editForm.workInfo.skills.length > 0 && (
                      <div className="skills-list">
                        {editForm.workInfo.skills.map((skill, index) => (
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
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button className="btn-primary" onClick={() => updateWorker(editingWorker)}>
                Update Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageWorkers;