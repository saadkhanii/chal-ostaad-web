import React, { useState, useEffect } from 'react';
import './ViewAdmins.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ViewAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch admins in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const adminsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdmins(adminsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter admins based on search and filters
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    const matchesStatus = filterStatus === 'all' || admin.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
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

  if (loading) {
    return (
      <div className="view-admins-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Loading admins...
        </div>
      </div>
    );
  }

  return (
    <div className="view-admins-container">
      {/* Statistics Overview */}
      <div className="admins-stats">
        <div className="stat-card total-admins">
          <div className="stat-icon">👨‍💼</div>
          <div className="stat-content">
            <div className="stat-number">{admins.length}</div>
            <div className="stat-label">Total Admins</div>
            <div className="stat-trend">All system administrators</div>
          </div>
        </div>
        
        <div className="stat-card super-admins">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <div className="stat-number">
              {admins.filter(admin => admin.role === 'super').length}
            </div>
            <div className="stat-label">Super Admins</div>
            <div className="stat-trend">Full system access</div>
          </div>
        </div>
        
        <div className="stat-card sub-admins">
          <div className="stat-icon">👨‍💻</div>
          <div className="stat-content">
            <div className="stat-number">
              {admins.filter(admin => admin.role === 'sub').length}
            </div>
            <div className="stat-label">Sub Admins</div>
            <div className="stat-trend">Limited permissions</div>
          </div>
        </div>
        
        <div className="stat-card active-admins">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">
              {admins.filter(admin => admin.status === 'active').length}
            </div>
            <div className="stat-label">Active Admins</div>
            <div className="stat-trend">Currently active</div>
          </div>
        </div>
      </div>

      {/* Search and Filters - Perfectly aligned in one line */}
      <div className="filters-section">
        <div className="filters-grid">
          {/* Search */}
          <div className="filter-group search-group">
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
          <div className="filter-group role-group">
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

          {/* Status Filter */}
          <div className="filter-group status-group">
            <label>Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="filter-group clear-group">
            <label>&nbsp;</label>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilterRole('all');
                setFilterStatus('all');
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

      {/* Admins Grid */}
      {filteredAdmins.length === 0 ? (
        <div className="empty-state">
          <p>No administrators found matching your filters.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterRole('all');
              setFilterStatus('all');
            }} 
            className="clear-filters-btn"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="admins-grid">
          {filteredAdmins.map(admin => {
            const roleBadge = getRoleBadge(admin.role);
            const statusBadge = getStatusBadge(admin.status);
            
            return (
              <div key={admin.id} className="admin-card">
                <div className="admin-header">
                  <div className="admin-avatar">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="admin-basic-info">
                    <h4 className="admin-name">{admin.name}</h4>
                    <p className="admin-email">{admin.email}</p>
                  </div>
                  <div className="admin-badges">
                    <span 
                      className="role-badge"
                      style={{ backgroundColor: roleBadge.color }}
                    >
                      {roleBadge.icon} {roleBadge.label}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: statusBadge.color }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                <div className="admin-details">
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{admin.phone || 'Not provided'}</span>
                  </div>
                  
                  {admin.assignedOffice && (
                    <div className="detail-item">
                      <span className="detail-label">Assigned Office:</span>
                      <span className="detail-value">
                        {admin.assignedOffice.officeName} - {admin.assignedOffice.officeCity}
                      </span>
                    </div>
                  )}

                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {admin.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Last Login:</span>
                    <span className="detail-value">
                      {admin.lastLogin?.toDate?.().toLocaleDateString() || 'Never'}
                    </span>
                  </div>

                  {/* Permissions Summary */}
                  {admin.permissions && (
                    <div className="detail-item">
                      <span className="detail-label">Permissions:</span>
                      <div className="permissions-tags">
                        {Object.entries(admin.permissions)
                          .filter(([_, hasPermission]) => hasPermission)
                          .slice(0, 3)
                          .map(([permission]) => (
                            <span key={permission} className="permission-tag">
                              {permission}
                            </span>
                          ))}
                        {Object.values(admin.permissions).filter(Boolean).length > 3 && (
                          <span className="more-permissions">
                            +{Object.values(admin.permissions).filter(Boolean).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewAdmins;