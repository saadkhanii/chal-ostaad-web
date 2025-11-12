import React, { useState, useEffect } from 'react';
import './ViewOffices.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ViewOffices = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOffice, setSelectedOffice] = useState(null); // NEW: For office details modal

  // Fetch offices and worker counts
  useEffect(() => {
    const fetchOfficesWithWorkerCounts = async () => {
      try {
        setLoading(true);
        
        // Fetch all offices
        const officesSnapshot = await getDocs(collection(db, 'offices'));
        const officesData = [];
        
        // For each office, count workers assigned to it
        for (const officeDoc of officesSnapshot.docs) {
          const officeData = officeDoc.data();
          const officeId = officeDoc.id;
          
          // Query workers assigned to this office
          const workersQuery = query(
            collection(db, 'workers'),
            where('officeInfo.officeId', '==', officeId)
          );
          const workersSnapshot = await getDocs(workersQuery);
          const workerCount = workersSnapshot.size;
          
          // Query verified workers
          const activeWorkersQuery = query(
            collection(db, 'workers'),
            where('officeInfo.officeId', '==', officeId),
            where('verification.status', '==', 'verified')
          );
          const activeWorkersSnapshot = await getDocs(activeWorkersQuery);
          const activeWorkerCount = activeWorkersSnapshot.size;
          
          officesData.push({
            id: officeId,
            ...officeData,
            stats: {
              totalWorkers: workerCount,
              activeWorkers: activeWorkerCount,
              completedJobs: officeData.stats?.completedJobs || 0
            }
          });
        }
        
        setOffices(officesData);
      } catch (error) {
        console.error('Error fetching offices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficesWithWorkerCounts();
  }, []);

  // Filter offices based on search and filters
  const filteredOffices = offices.filter(office => {
    const matchesSearch = office.basicInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         office.basicInfo.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || office.details.type === filterType;
    const matchesStatus = filterStatus === 'all' || office.details.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get office type badge color
  const getOfficeTypeBadge = (type) => {
    const types = {
      'main': { label: 'Main Office', color: '#FF6B35' },
      'branch': { label: 'Branch Office', color: '#1E88E5' },
      'partner': { label: 'Partner Office', color: '#43A047' }
    };
    return types[type] || { label: type, color: '#757575' };
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statuses = {
      'active': { label: 'Active', color: '#4CAF50' },
      'inactive': { label: 'Inactive', color: '#F44336' },
      'maintenance': { label: 'Maintenance', color: '#FF9800' }
    };
    return statuses[status] || { label: status, color: '#757575' };
  };

  // NEW: Handle View Details click
  const handleViewDetails = (office) => {
    setSelectedOffice(office);
  };

  // NEW: Close details modal
  const closeDetailsModal = () => {
    setSelectedOffice(null);
  };

  if (loading) {
    return (
      <div className="view-offices-container">
        <div className="loading-spinner">Loading offices...</div>
      </div>
    );
  }

  return (
    <div className="view-offices-container">
      <div className="view-offices-header">
        <h2>View Offices</h2>
        <p>Manage and monitor all office locations</p>
      </div>

      {/* Statistics Overview */}
      <div className="office-stats-overview">
        <div className="stat-card">
          <div className="stat-number">{offices.length}</div>
          <div className="stat-label">Total Offices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {offices.reduce((sum, office) => sum + office.stats.totalWorkers, 0)}
          </div>
          <div className="stat-label">Total Workers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {offices.filter(office => office.details.status === 'active').length}
          </div>
          <div className="stat-label">Active Offices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {offices.reduce((sum, office) => sum + office.stats.activeWorkers, 0)}
          </div>
          <div className="stat-label">Verified Workers</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="office-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search offices by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="main">Main Office</option>
            <option value="branch">Branch Office</option>
            <option value="partner">Partner Office</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Offices Grid */}
      {filteredOffices.length === 0 ? (
        <div className="no-offices">
          <h3>No offices found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="offices-grid">
          {filteredOffices.map(office => {
            const typeBadge = getOfficeTypeBadge(office.details.type);
            const statusBadge = getStatusBadge(office.details.status);
            
            return (
              <div key={office.id} className="office-card">
                <div className="office-card-header">
                  <h3 className="office-name">{office.basicInfo.name}</h3>
                  <div className="office-badges">
                    <span 
                      className="type-badge"
                      style={{ backgroundColor: typeBadge.color }}
                    >
                      {typeBadge.label}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: statusBadge.color }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
                
                <div className="office-info">
                  <div className="info-item">
                    <span className="label">📍 Location:</span>
                    <span className="value">{office.basicInfo.city}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">📞 Phone:</span>
                    <span className="value">{office.basicInfo.phone}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">👨‍💼 Manager:</span>
                    <span className="value">{office.management.managerName || 'Not assigned'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">🛠️ Staff:</span>
                    <span className="value">{office.management.staffCount} administrative staff</span>
                  </div>
                </div>
                
                {/* Worker Statistics */}
                <div className="worker-stats">
                  <h4>Worker Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-number">{office.stats.totalWorkers}</div>
                      <div className="stat-label">Total Workers</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number verified">{office.stats.activeWorkers}</div>
                      <div className="stat-label">Verified</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number pending">
                        {office.stats.totalWorkers - office.stats.activeWorkers}
                      </div>
                      <div className="stat-label">Pending</div>
                    </div>
                  </div>
                </div>
                
                {/* Service Areas */}
                {office.location.serviceAreas.length > 0 && (
                  <div className="service-areas">
                    <span className="label">Service Areas:</span>
                    <div className="areas-tags">
                      {office.location.serviceAreas.slice(0, 3).map((area, index) => (
                        <span key={index} className="area-tag">{area}</span>
                      ))}
                      {office.location.serviceAreas.length > 3 && (
                        <span className="area-tag-more">
                          +{office.location.serviceAreas.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* UPDATED: Actions - Removed Manage Workers button */}
                <div className="office-card-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleViewDetails(office)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW: Office Details Modal */}
      {selectedOffice && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Office Details - {selectedOffice.basicInfo.name}</h3>
              <button className="close-btn" onClick={closeDetailsModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h4>Basic Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Office Name:</label>
                    <span>{selectedOffice.basicInfo.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>City:</label>
                    <span>{selectedOffice.basicInfo.city}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone:</label>
                    <span>{selectedOffice.basicInfo.phone}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email:</label>
                    <span>{selectedOffice.basicInfo.email || 'Not provided'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Address:</label>
                    <span>{selectedOffice.basicInfo.address || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Office Details</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{getOfficeTypeBadge(selectedOffice.details.type).label}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span>{getStatusBadge(selectedOffice.details.status).label}</span>
                  </div>
                  <div className="detail-item">
                    <label>Established:</label>
                    <span>{selectedOffice.details.establishedDate || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Capacity:</label>
                    <span>{selectedOffice.details.capacity || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Management</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Manager:</label>
                    <span>{selectedOffice.management.managerName || 'Not assigned'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Manager Phone:</label>
                    <span>{selectedOffice.management.managerPhone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Staff Count:</label>
                    <span>{selectedOffice.management.staffCount} administrative staff</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Location & Service</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Latitude:</label>
                    <span>{selectedOffice.location.coordinates?.latitude || 'Not set'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Longitude:</label>
                    <span>{selectedOffice.location.coordinates?.longitude || 'Not set'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Service Areas:</label>
                    <div className="areas-tags-full">
                      {selectedOffice.location.serviceAreas.map((area, index) => (
                        <span key={index} className="area-tag">{area}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Statistics</h4>
                <div className="stats-grid-detailed">
                  <div className="stat-item-detailed">
                    <div className="stat-number">{selectedOffice.stats.totalWorkers}</div>
                    <div className="stat-label">Total Workers</div>
                  </div>
                  <div className="stat-item-detailed">
                    <div className="stat-number verified">{selectedOffice.stats.activeWorkers}</div>
                    <div className="stat-label">Verified Workers</div>
                  </div>
                  <div className="stat-item-detailed">
                    <div className="stat-number pending">{selectedOffice.stats.totalWorkers - selectedOffice.stats.activeWorkers}</div>
                    <div className="stat-label">Pending Workers</div>
                  </div>
                  <div className="stat-item-detailed">
                    <div className="stat-number">{selectedOffice.stats.completedJobs}</div>
                    <div className="stat-label">Completed Jobs</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeDetailsModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOffices;