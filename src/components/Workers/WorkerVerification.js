import React, { useState, useEffect } from 'react';
import './WorkerVerification.css';
import { collection, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const WorkerVerification = () => {
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [categories, setCategories] = useState({});

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesSnapshot = await getDocs(collection(db, 'workCategories'));
        const categoriesMap = {};
        
        categoriesSnapshot.forEach(doc => {
          categoriesMap[doc.id] = doc.data().name || 'Unknown Category';
        });
        
        setCategories(categoriesMap);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch workers needing verification
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkers(workersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter workers based on verification status
  useEffect(() => {
    let result = workers;
    
    if (filterStatus !== 'all') {
      result = result.filter(worker => worker.verification?.status === filterStatus);
    }

    // Sort by creation date (oldest first for pending)
    result = result.sort((a, b) => {
      if (filterStatus === 'pending') {
        return new Date(a.createdAt?.toDate?.()) - new Date(b.createdAt?.toDate?.());
      }
      return new Date(b.createdAt?.toDate?.()) - new Date(a.createdAt?.toDate?.());
    });

    setFilteredWorkers(result);
  }, [workers, filterStatus]);

  // Helper function to get category name
  const getCategoryName = (categoryId) => {
    return categories[categoryId] || categoryId || 'Unknown Category';
  };

  // Handle verification actions
  const handleVerification = async (workerId, status, reason = '') => {
    setActionLoading(true);
    setMessage('');

    try {
      await updateDoc(doc(db, 'workers', workerId), {
        'verification.status': status,
        'verification.verifiedAt': status === 'verified' ? new Date() : null,
        'verification.rejectionReason': reason || '',
        'verification.verifiedBy': 'Admin System',
        'verification.lastUpdated': new Date(),
        'updatedAt': new Date()
      });

      setMessage(`✅ Worker ${status === 'verified' ? 'verified' : 'rejected'} successfully!`);
      setSelectedWorker(null);
      setRejectionReason('');
      
    } catch (error) {
      console.error('Error updating verification:', error);
      setMessage('❌ Error updating verification: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statuses = {
      'pending': { label: 'Pending Review', color: '#f59e0b', icon: '⏳' },
      'verified': { label: 'Verified', color: '#10b981', icon: '✅' },
      'rejected': { label: 'Rejected', color: '#ef4444', icon: '❌' }
    };
    return statuses[status] || statuses.pending;
  };

  // Calculate statistics
  const pendingCount = workers.filter(w => w.verification?.status === 'pending').length;
  const verifiedCount = workers.filter(w => w.verification?.status === 'verified').length;
  const rejectedCount = workers.filter(w => w.verification?.status === 'rejected').length;

  if (loading) {
    return (
      <div className="worker-verification-container">
        <div className="loading-state">Loading verification queue...</div>
      </div>
    );
  }

  return (
    <div className="worker-verification-container">
      {/* REMOVED: Header since ContentDisplay handles it */}

      {/* Verification Statistics */}
      <div className="verification-stats">
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>

        <div className="stat-card verified">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{verifiedCount}</div>
            <div className="stat-label">Verified Workers</div>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{rejectedCount}</div>
            <div className="stat-label">Rejected Workers</div>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">👷</div>
          <div className="stat-content">
            <div className="stat-number">{workers.length}</div>
            <div className="stat-label">Total Workers</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Workers</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="results-count">
          Showing {filteredWorkers.length} workers
        </div>
      </div>

      {/* Worker List */}
      <div className="verification-queue">
        {filteredWorkers.length === 0 ? (
          <div className="empty-state">
            <p>No workers found with the selected filter.</p>
          </div>
        ) : (
          <div className="workers-list">
            {filteredWorkers.map(worker => {
              const statusBadge = getStatusBadge(worker.verification?.status);
              
              return (
                <div 
                  key={worker.id} 
                  className={`worker-item ${selectedWorker?.id === worker.id ? 'selected' : ''}`}
                  onClick={() => setSelectedWorker(worker)}
                >
                  <div className="worker-avatar">
                    {worker.personalInfo.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="worker-info">
                    <h4 className="worker-name">{worker.personalInfo.name}</h4>
                    <p className="worker-details">
                      {worker.personalInfo.phone} • {getCategoryName(worker.workInfo.categoryId)}
                    </p>
                    <p className="worker-added">
                      Added: {worker.createdAt?.toDate?.().toLocaleDateString()}
                    </p>
                  </div>

                  <div className="verification-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: statusBadge.color }}
                    >
                      {statusBadge.icon} {statusBadge.label}
                    </span>
                  </div>

                  {worker.verification?.status === 'pending' && (
                    <div className="quick-actions">
                      <button 
                        className="action-btn approve-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerification(worker.id, 'verified');
                        }}
                        disabled={actionLoading}
                      >
                        Approve
                      </button>
                      <button 
                        className="action-btn reject-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorker(worker);
                        }}
                        disabled={actionLoading}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Worker Details Modal */}
      {selectedWorker && (
        <div className="modal-overlay" onClick={() => setSelectedWorker(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Worker Verification Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedWorker(null)}
              >
                ×
              </button>
            </div>

            <div className="worker-details-panel">
              <div className="detail-section">
                <h4>Personal Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{selectedWorker.personalInfo.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedWorker.personalInfo.phone}</span>
                  </div>
                  <div className="detail-item">
                    <label>CNIC:</label>
                    <span>{selectedWorker.personalInfo.cnic || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedWorker.personalInfo.email || 'Not provided'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Address:</label>
                    <span>{selectedWorker.personalInfo.address || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Work Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{getCategoryName(selectedWorker.workInfo.categoryId)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Experience:</label>
                    <span>{selectedWorker.workInfo.experience || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Service Radius:</label>
                    <span>{selectedWorker.workInfo.serviceRadius} km</span>
                  </div>
                  <div className="detail-item">
                    <label>Availability:</label>
                    <span>{selectedWorker.workInfo.availability}</span>
                  </div>
                </div>
                
                {selectedWorker.workInfo.skills.length > 0 && (
                  <div className="skills-section">
                    <label>Skills:</label>
                    <div className="skills-list">
                      {selectedWorker.workInfo.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Verification Status</h4>
                <div className="verification-info">
                  <div className="status-display">
                    Current Status: 
                    <span 
                      className="status-badge large"
                      style={{ backgroundColor: getStatusBadge(selectedWorker.verification?.status).color }}
                    >
                      {getStatusBadge(selectedWorker.verification?.status).icon} 
                      {getStatusBadge(selectedWorker.verification?.status).label}
                    </span>
                  </div>
                  
                  {selectedWorker.verification?.rejectionReason && (
                    <div className="rejection-reason">
                      <label>Rejection Reason:</label>
                      <p>{selectedWorker.verification.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Actions */}
              {selectedWorker.verification?.status === 'pending' && (
                <div className="verification-actions">
                  <h4>Verification Actions</h4>
                  
                  <div className="action-buttons">
                    <button 
                      className="btn-primary approve-btn"
                      onClick={() => handleVerification(selectedWorker.id, 'verified')}
                      disabled={actionLoading}
                    >
                      ✅ Approve Worker
                    </button>
                    
                    <div className="rejection-section">
                      <label>Rejection Reason (Optional):</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Specify reason for rejection..."
                        rows="3"
                      />
                      <button 
                        className="btn-danger reject-btn"
                        onClick={() => handleVerification(selectedWorker.id, 'rejected', rejectionReason)}
                        disabled={actionLoading}
                      >
                        ❌ Reject Worker
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default WorkerVerification;