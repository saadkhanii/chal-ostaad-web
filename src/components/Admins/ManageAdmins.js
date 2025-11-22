import React, { useState, useEffect } from 'react';
import './ManageAdmins.css';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'sub',
    status: 'active',
    assignedOffice: ''
  });

  // Fetch admins and offices in real-time
  useEffect(() => {
    const unsubscribeAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const adminsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdmins(adminsData);
    });

    const unsubscribeOffices = onSnapshot(collection(db, 'offices'), (snapshot) => {
      const officesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched offices:', officesData); // Debug
      setOffices(officesData);
      setLoading(false);
    });

    return () => {
      unsubscribeAdmins();
      unsubscribeOffices();
    };
  }, []);

  // Filter admins based on search
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Get role badge color
  const getRoleBadge = (role) => {
    const roles = {
      'super': { label: 'Super Admin', color: '#FF6B35', icon: '👑' },
      'sub': { label: 'Sub Admin', color: '#1E88E5', icon: '👨‍💼' }
    };
    return roles[role] || { label: role, color: '#757575', icon: '❓' };
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statuses = {
      'active': { label: 'Active', color: '#10b981' },
      'inactive': { label: 'Inactive', color: '#6c757d' },
      'suspended': { label: 'Suspended', color: '#ef4444' }
    };
    return statuses[status] || { label: status, color: '#757575' };
  };

  // Start editing an admin
  const startEdit = (admin) => {
    console.log('Starting edit for admin:', admin);
    console.log('Admin assigned office:', admin.assignedOffice);
    console.log('Available offices count:', offices.length);
    
    let officeId = '';
    
    // Extract office ID from assignedOffice
    if (admin.assignedOffice) {
      // Check if assignedOffice is an object with officeId
      if (admin.assignedOffice.officeId) {
        officeId = admin.assignedOffice.officeId;
      } 
      // Check if assignedOffice is directly the office ID
      else if (typeof admin.assignedOffice === 'string') {
        officeId = admin.assignedOffice;
      }
      // Check if assignedOffice is an object with id
      else if (admin.assignedOffice.id) {
        officeId = admin.assignedOffice.id;
      }
    }
    
    console.log('Extracted office ID:', officeId);
    
    setEditingAdmin(admin.id);
    setEditForm({
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      role: admin.role || 'sub',
      status: admin.status || 'active',
      assignedOffice: officeId
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingAdmin(null);
    setEditForm({
      name: '',
      email: '',
      phone: '',
      role: 'sub',
      status: 'active',
      assignedOffice: ''
    });
  };

  // Update admin
  const updateAdmin = async (adminId) => {
    try {
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        status: editForm.status,
        updatedAt: new Date()
      };

      // Handle office assignment
      if (editForm.assignedOffice && editForm.assignedOffice !== '') {
        const selectedOffice = offices.find(office => office.id === editForm.assignedOffice);
        console.log('Selected office for assignment:', selectedOffice);
        
        if (selectedOffice) {
          updateData.assignedOffice = {
            officeId: selectedOffice.id,
            officeName: selectedOffice.basicInfo?.name || selectedOffice.name || 'Unknown Office',
            officeCity: selectedOffice.basicInfo?.city || selectedOffice.city || 'Unknown City'
          };
        }
      } else {
        // Remove office assignment if empty
        updateData.assignedOffice = null;
      }

      console.log('Updating admin with data:', updateData);
      await updateDoc(doc(db, 'admins', adminId), updateData);
      setEditingAdmin(null);
      alert('Admin updated successfully!');
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('Error updating admin: ' + error.message);
    }
  };

  // Remove office assignment
  const removeOfficeAssignment = async (adminId, adminName) => {
    if (!window.confirm(`Remove office assignment from ${adminName}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'admins', adminId), {
        assignedOffice: null,
        updatedAt: new Date()
      });
      alert('Office assignment removed successfully!');
    } catch (error) {
      console.error('Error removing office assignment:', error);
      alert('Error removing office assignment: ' + error.message);
    }
  };

  // Toggle admin status
  const toggleAdminStatus = async (adminId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await updateDoc(doc(db, 'admins', adminId), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Error updating admin status: ' + error.message);
    }
  };

  // Delete admin (with confirmation)
  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'admins', adminId));
      alert('Admin deleted successfully!');
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Error deleting admin: ' + error.message);
    }
  };

  // Get office display name
  const getOfficeDisplayName = (assignedOffice) => {
    if (!assignedOffice) return 'Not Assigned';
    
    if (assignedOffice.officeName && assignedOffice.officeCity) {
      return `${assignedOffice.officeName} - ${assignedOffice.officeCity}`;
    }
    
    if (assignedOffice.officeName) {
      return assignedOffice.officeName;
    }
    
    return 'Assigned Office';
  };

  if (loading) {
    return (
      <div className="manage-admins-container">
        <div className="loading-state">Loading admins and offices...</div>
      </div>
    );
  }

  return (
    <div className="manage-admins-container">
      {/* REMOVED: Header since ContentDisplay handles it */}
      {/* <div className="manage-admins-header">
        <h2>Manage Administrators</h2>
        <p>Update, delete, and manage admin accounts including office assignments</p>
      </div> */}

      {/* Statistics Overview */}
      <div className="admins-stats">
        <div className="stat-card">
          <div className="stat-number">{admins.length}</div>
          <div className="stat-label">Total Admins</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {admins.filter(admin => admin.role === 'super').length}
          </div>
          <div className="stat-label">Super Admins</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {admins.filter(admin => admin.role === 'sub').length}
          </div>
          <div className="stat-label">Sub Admins</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {admins.filter(admin => admin.assignedOffice).length}
          </div>
          <div className="stat-label">Assigned to Offices</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          {/* Search */}
          <div className="filter-group">
            <label>Search Admins</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Role Filter */}
          <div className="filter-group">
            <label>Role</label>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="super">Super Admin</option>
              <option value="sub">Sub Admin</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="filter-group">
            <label>&nbsp;</label>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterRole('all');
              }} 
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-count">
          Showing {filteredAdmins.length} of {admins.length} administrators
        </div>
      </div>

      {/* Admins Table */}
      {filteredAdmins.length === 0 ? (
        <div className="empty-state">
          <p>No administrators found matching your filters.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterRole('all');
            }} 
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="admins-table-container">
          <table className="admins-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Contact</th>
                <th>Assigned Office</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map(admin => {
                const roleBadge = getRoleBadge(admin.role);
                const statusBadge = getStatusBadge(admin.status);
                
                return (
                  <tr key={admin.id} className="admin-row">
                    <td>
                      <div className="admin-info-cell">
                        <div className="admin-avatar">
                          {admin.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="admin-details-cell">
                          <div className="admin-name">{admin.name || 'Unknown'}</div>
                          <div className="admin-created">
                            Created: {admin.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="admin-email">{admin.email || 'No email'}</div>
                        <div className="admin-phone">{admin.phone || 'No phone'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="office-assignment">
                        {admin.assignedOffice ? (
                          <div className="office-info">
                            <div className="office-name">
                              {getOfficeDisplayName(admin.assignedOffice)}
                            </div>
                            <button 
                              className="remove-office-btn"
                              onClick={() => removeOfficeAssignment(admin.id, admin.name)}
                              title="Remove office assignment"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <span className="no-office">Not Assigned</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span 
                        className="role-badge"
                        style={{ backgroundColor: roleBadge.color }}
                      >
                        {roleBadge.icon} {roleBadge.label}
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
                      {admin.lastLogin?.toDate?.().toLocaleDateString() || 'Never'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => startEdit(admin)}
                        >
                          Edit
                        </button>
                        <button 
                          className={`action-btn status-btn ${admin.status === 'active' ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleAdminStatus(admin.id, admin.status)}
                        >
                          {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteAdmin(admin.id, admin.name)}
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
      {editingAdmin && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Admin</h3>
              <button className="close-btn" onClick={cancelEdit}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="form-input"
                  placeholder="Optional"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="form-select"
                >
                  <option value="sub">Sub Admin</option>
                  <option value="super">Super Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {/* Office Assignment Field */}
              <div className="form-group">
                <label>Assign to Office</label>
                <select
                  value={editForm.assignedOffice}
                  onChange={(e) => setEditForm({...editForm, assignedOffice: e.target.value})}
                  className="form-select"
                >
                  <option value="">No Office Assignment</option>
                  {offices.map(office => (
                    <option key={office.id} value={office.id}>
                      {office.basicInfo?.name || office.name} - {office.basicInfo?.city || office.city}
                    </option>
                  ))}
                </select>
                <div className="form-help">
                  {editForm.assignedOffice ? 
                    `Selected: ${offices.find(o => o.id === editForm.assignedOffice)?.basicInfo?.name || 'Office'}` : 
                    'No office selected'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button className="btn-primary" onClick={() => updateAdmin(editingAdmin)}>Update Admin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmins;