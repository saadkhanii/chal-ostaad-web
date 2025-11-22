import React, { useState, useEffect } from 'react';
import './ManageOffices.css';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ManageOffices = () => {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingOffice, setEditingOffice] = useState(null);
  const [editForm, setEditForm] = useState({
    basicInfo: {
      name: '',
      phone: '',
      city: '',
      address: ''
    },
    details: {
      type: 'branch',
      status: 'active'
    },
    management: {
      managerName: '',
      staffCount: 0
    },
    location: {
      serviceAreas: []
    }
  });
  const [newServiceArea, setNewServiceArea] = useState('');

  // Fetch offices in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'offices'), (snapshot) => {
      const officesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOffices(officesData);
      setLoading(false);
    });

    return () => unsubscribe();
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

  // Start editing an office
  const startEdit = (office) => {
    setEditingOffice(office.id);
    setEditForm({
      basicInfo: {
        name: office.basicInfo.name || '',
        phone: office.basicInfo.phone || '',
        city: office.basicInfo.city || '',
        address: office.basicInfo.address || ''
      },
      details: {
        type: office.details.type || 'branch',
        status: office.details.status || 'active'
      },
      management: {
        managerName: office.management.managerName || '',
        staffCount: office.management.staffCount || 0
      },
      location: {
        serviceAreas: [...(office.location.serviceAreas || [])]
      }
    });
    setNewServiceArea('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingOffice(null);
    setEditForm({
      basicInfo: { name: '', phone: '', city: '', address: '' },
      details: { type: 'branch', status: 'active' },
      management: { managerName: '', staffCount: 0 },
      location: { serviceAreas: [] }
    });
    setNewServiceArea('');
  };

  // Handle form field changes
  const handleBasicInfoChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [e.target.name]: e.target.value
      }
    }));
  };

  const handleDetailsChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [e.target.name]: e.target.value
      }
    }));
  };

  const handleManagementChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      management: {
        ...prev.management,
        [e.target.name]: e.target.value
      }
    }));
  };

  // Service areas management
  const handleAddServiceArea = () => {
    if (newServiceArea.trim() && !editForm.location.serviceAreas.includes(newServiceArea.trim())) {
      setEditForm(prev => ({
        ...prev,
        location: {
          ...prev.location,
          serviceAreas: [...prev.location.serviceAreas, newServiceArea.trim()]
        }
      }));
      setNewServiceArea('');
    }
  };

  const handleRemoveServiceArea = (areaToRemove) => {
    setEditForm(prev => ({
      ...prev,
      location: {
        ...prev.location,
        serviceAreas: prev.location.serviceAreas.filter(area => area !== areaToRemove)
      }
    }));
  };

  const handleServiceAreaKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddServiceArea();
    }
  };

  // Update office
  const updateOffice = async (officeId) => {
    try {
      const updateData = {
        'basicInfo.name': editForm.basicInfo.name,
        'basicInfo.phone': editForm.basicInfo.phone,
        'basicInfo.city': editForm.basicInfo.city,
        'basicInfo.address': editForm.basicInfo.address,
        'details.type': editForm.details.type,
        'details.status': editForm.details.status,
        'management.managerName': editForm.management.managerName,
        'management.staffCount': parseInt(editForm.management.staffCount) || 0,
        'location.serviceAreas': editForm.location.serviceAreas,
        'updatedAt': new Date()
      };

      await updateDoc(doc(db, 'offices', officeId), updateData);
      setEditingOffice(null);
      alert('✅ Office updated successfully!');
    } catch (error) {
      console.error('Error updating office:', error);
      alert('❌ Error updating office: ' + error.message);
    }
  };

  // Delete office (with confirmation)
  const handleDeleteOffice = async (officeId, officeName) => {
    if (!window.confirm(`Are you sure you want to delete office "${officeName}"? This action cannot be undone and all associated workers will need to be reassigned.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'offices', officeId));
      alert('✅ Office deleted successfully!');
    } catch (error) {
      console.error('Error deleting office:', error);
      alert('❌ Error deleting office: ' + error.message);
    }
  };

  // Toggle office status
  const toggleOfficeStatus = async (officeId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await updateDoc(doc(db, 'offices', officeId), {
        'details.status': newStatus,
        'updatedAt': new Date()
      });
    } catch (error) {
      console.error('Error updating office status:', error);
      alert('❌ Error updating office status: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="manage-offices-container">
        <div className="loading-state">Loading offices...</div>
      </div>
    );
  }

  return (
    <div className="manage-offices-container">
      {/* REMOVED: Header since ContentDisplay handles it */}

      {/* Statistics Overview */}
      <div className="offices-stats">
        <div className="stat-card">
          <div className="stat-number">{offices.length}</div>
          <div className="stat-label">Total Offices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {offices.filter(office => office.details.status === 'active').length}
          </div>
          <div className="stat-label">Active Offices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {offices.filter(office => office.details.type === 'main').length}
          </div>
          <div className="stat-label">Main Offices</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {offices.filter(office => office.details.type === 'branch').length}
          </div>
          <div className="stat-label">Branch Offices</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Search Offices</label>
            <input
              type="text"
              placeholder="Search by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Type</label>
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
          </div>

          <div className="filter-group">
            <label>Status</label>
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

          <div className="filter-group">
            <label>&nbsp;</label>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }} 
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="results-count">
          Showing {filteredOffices.length} of {offices.length} offices
        </div>
      </div>

      {/* Offices Table */}
      {filteredOffices.length === 0 ? (
        <div className="empty-state">
          <p>No offices found matching your filters.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterStatus('all');
            }} 
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="offices-table-container">
          <table className="offices-table">
            <thead>
              <tr>
                <th>Office Name</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Manager</th>
                <th>Staff</th>
                <th>Service Areas</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffices.map(office => {
                const typeBadge = getOfficeTypeBadge(office.details.type);
                const statusBadge = getStatusBadge(office.details.status);
                
                return (
                  <tr key={office.id} className="office-row">
                    <td>
                      <div className="office-info-cell">
                        <div className="office-name">{office.basicInfo.name}</div>
                        <div className="office-phone">{office.basicInfo.phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="location-info">
                        <div className="city">{office.basicInfo.city}</div>
                        <div className="address">{office.basicInfo.address}</div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="type-badge"
                        style={{ backgroundColor: typeBadge.color }}
                      >
                        {typeBadge.label}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: statusBadge.color }}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td>
                      {office.management.managerName || 'Not assigned'}
                    </td>
                    <td>
                      {office.management.staffCount} staff
                    </td>
                    <td>
                      <div className="service-areas-preview">
                        {office.location.serviceAreas.slice(0, 2).map((area, index) => (
                          <span key={index} className="area-tag small">
                            {area}
                          </span>
                        ))}
                        {office.location.serviceAreas.length > 2 && (
                          <span className="more-areas">
                            +{office.location.serviceAreas.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => startEdit(office)}
                        >
                          Edit
                        </button>
                        <button 
                          className={`action-btn status-btn ${office.details.status === 'active' ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleOfficeStatus(office.id, office.details.status)}
                        >
                          {office.details.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteOffice(office.id, office.basicInfo.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingOffice && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Office</h3>
              <button className="close-btn" onClick={cancelEdit}>×</button>
            </div>
            <div className="modal-body">
              {/* Basic Information */}
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Office Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.basicInfo.name}
                      onChange={handleBasicInfoChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.basicInfo.phone}
                      onChange={handleBasicInfoChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={editForm.basicInfo.city}
                      onChange={handleBasicInfoChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={editForm.basicInfo.address}
                      onChange={handleBasicInfoChange}
                      className="form-input"
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* Office Details */}
              <div className="form-section">
                <h4>Office Details</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Office Type</label>
                    <select
                      name="type"
                      value={editForm.details.type}
                      onChange={handleDetailsChange}
                      className="form-input"
                    >
                      <option value="main">Main Office</option>
                      <option value="branch">Branch Office</option>
                      <option value="partner">Partner Office</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={editForm.details.status}
                      onChange={handleDetailsChange}
                      className="form-input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Management Information */}
              <div className="form-section">
                <h4>Management</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Manager Name</label>
                    <input
                      type="text"
                      name="managerName"
                      value={editForm.management.managerName}
                      onChange={handleManagementChange}
                      className="form-input"
                      placeholder="Enter manager's name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Staff Count</label>
                    <input
                      type="number"
                      name="staffCount"
                      value={editForm.management.staffCount}
                      onChange={handleManagementChange}
                      className="form-input"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Service Areas */}
              <div className="form-section">
                <h4>Service Areas</h4>
                <div className="form-group full-width">
                  <label>Add Service Area</label>
                  <div className="service-area-input-group">
                    <input
                      type="text"
                      value={newServiceArea}
                      onChange={(e) => setNewServiceArea(e.target.value)}
                      onKeyPress={handleServiceAreaKeyPress}
                      className="form-input"
                      placeholder="Enter service area name"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddServiceArea} 
                      className="add-area-btn"
                    >
                      Add Area
                    </button>
                  </div>
                  
                  {editForm.location.serviceAreas.length > 0 && (
                    <div className="service-areas-list">
                      {editForm.location.serviceAreas.map((area, index) => (
                        <span key={index} className="area-tag">
                          {area}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveServiceArea(area)}
                            className="remove-area"
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
            <div className="modal-footer">
              <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button className="btn-primary" onClick={() => updateOffice(editingOffice)}>
                Update Office
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOffices;