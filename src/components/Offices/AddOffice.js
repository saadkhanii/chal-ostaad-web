import React, { useState, useEffect } from 'react';
import './AddOffice.css';
import { collection, addDoc, getDocs, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';

const AddOffice = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [admins, setAdmins] = useState([]); // For manager assignment
  
  const [formData, setFormData] = useState({
    // Basic Office Information
    basicInfo: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      establishedDate: ''
    },
    // Location & Service Area
    location: {
      coordinates: { lat: '', lng: '' },
      serviceAreas: [],
      radius: 20
    },
    // Management
    management: {
      managerId: '',
      managerName: '',
      staffCount: 0
    },
    // Office Details
    details: {
      type: 'branch',
      status: 'active',
      facilities: []
    },
    // Admin who added this office
    addedBy: {
      adminId: '',
      adminName: '',
      adminEmail: ''
    }
  });

  const [newServiceArea, setNewServiceArea] = useState('');
  const [newFacility, setNewFacility] = useState('');

  // Fetch admins for manager assignment and set current admin info
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        const adminsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAdmins(adminsData);
      } catch (error) {
        console.error('Error fetching admins:', error);
      }
    };

    // Set current admin information
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

    fetchAdmins();
    setAdminInfo();
  }, []);

  const handleBasicInfoChange = (e) => {
    setFormData({
      ...formData,
      basicInfo: {
        ...formData.basicInfo,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleLocationChange = (e) => {
    if (e.target.name === 'lat' || e.target.name === 'lng') {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          coordinates: {
            ...formData.location.coordinates,
            [e.target.name]: e.target.value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [e.target.name]: e.target.value
        }
      });
    }
  };

  const handleManagementChange = (e) => {
    if (e.target.name === 'managerId') {
      const selectedAdmin = admins.find(admin => admin.id === e.target.value);
      setFormData({
        ...formData,
        management: {
          ...formData.management,
          managerId: e.target.value,
          managerName: selectedAdmin ? selectedAdmin.name : ''
        }
      });
    } else {
      setFormData({
        ...formData,
        management: {
          ...formData.management,
          [e.target.name]: e.target.value
        }
      });
    }
  };

  const handleDetailsChange = (e) => {
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleAddServiceArea = () => {
    if (newServiceArea.trim() && !formData.location.serviceAreas.includes(newServiceArea.trim())) {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          serviceAreas: [...formData.location.serviceAreas, newServiceArea.trim()]
        }
      });
      setNewServiceArea('');
    }
  };

  const handleRemoveServiceArea = (areaToRemove) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        serviceAreas: formData.location.serviceAreas.filter(area => area !== areaToRemove)
      }
    });
  };

  const handleAddFacility = () => {
    if (newFacility.trim() && !formData.details.facilities.includes(newFacility.trim())) {
      setFormData({
        ...formData,
        details: {
          ...formData.details,
          facilities: [...formData.details.facilities, newFacility.trim()]
        }
      });
      setNewFacility('');
    }
  };

  const handleRemoveFacility = (facilityToRemove) => {
    setFormData({
      ...formData,
      details: {
        ...formData.details,
        facilities: formData.details.facilities.filter(facility => facility !== facilityToRemove)
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!formData.basicInfo.name.trim()) {
      setMessage('❌ Office name is required!');
      setLoading(false);
      return;
    }

    if (!formData.basicInfo.phone.trim()) {
      setMessage('❌ Phone number is required!');
      setLoading(false);
      return;
    }

    if (!formData.basicInfo.address.trim()) {
      setMessage('❌ Office address is required!');
      setLoading(false);
      return;
    }

    try {
      // Prepare office data
      const officeData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        workers: [], // Empty array for future worker assignments
        stats: {
          totalWorkers: 0,
          activeWorkers: 0,
          completedJobs: 0
        }
      };

      // Add office to Firestore
      await addDoc(collection(db, 'offices'), officeData);

      setMessage('✅ Office added successfully!');
      
      // Reset form (but keep admin info)
      setFormData({
        basicInfo: {
          name: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          establishedDate: ''
        },
        location: {
          coordinates: { lat: '', lng: '' },
          serviceAreas: [],
          radius: 20
        },
        management: {
          managerId: '',
          managerName: '',
          staffCount: 0
        },
        details: {
          type: 'branch',
          status: 'active',
          facilities: []
        },
        addedBy: formData.addedBy // Keep the same admin info
      });
      setNewServiceArea('');
      setNewFacility('');

    } catch (error) {
      console.error('Error adding office:', error);
      setMessage('❌ Error adding office: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-office-container">
      {/* REMOVED: Header since ContentDisplay handles it */}
      {/* <div className="add-office-header">
        <h2>Add New Office</h2>
        <p>Register a new office location for Chal Ostaad</p>
      </div> */}

      <form onSubmit={handleSubmit} className="add-office-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Office Name *</label>
              <input
                type="text"
                name="name"
                value={formData.basicInfo.name}
                onChange={handleBasicInfoChange}
                required
                placeholder="Enter office name"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.basicInfo.phone}
                onChange={handleBasicInfoChange}
                required
                placeholder="+92 300 1234567"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.basicInfo.email}
                onChange={handleBasicInfoChange}
                placeholder="office@chalostaad.com"
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.basicInfo.city}
                onChange={handleBasicInfoChange}
                placeholder="Enter city"
              />
            </div>

            <div className="form-group">
              <label>Established Date</label>
              <input
                type="date"
                name="establishedDate"
                value={formData.basicInfo.establishedDate}
                onChange={handleBasicInfoChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group full-width">
              <label>Full Address *</label>
              <textarea
                name="address"
                value={formData.basicInfo.address}
                onChange={handleBasicInfoChange}
                required
                placeholder="Complete office address with landmarks"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Location & Service Area Section */}
        <div className="form-section">
          <h3>Location & Service Area</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="text"
                name="lat"
                value={formData.location.coordinates.lat}
                onChange={handleLocationChange}
                placeholder="31.5204"
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="text"
                name="lng"
                value={formData.location.coordinates.lng}
                onChange={handleLocationChange}
                placeholder="74.3587"
              />
            </div>

            <div className="form-group">
              <label>Service Radius (km)</label>
              <input
                type="number"
                name="radius"
                value={formData.location.radius}
                onChange={handleLocationChange}
                min="1"
                max="100"
                placeholder="20"
              />
            </div>

            <div className="form-group full-width">
              <label>Service Areas</label>
              <div className="areas-input-group">
                <input
                  type="text"
                  value={newServiceArea}
                  onChange={(e) => setNewServiceArea(e.target.value)}
                  placeholder="Add service area (e.g., Gulberg, DHA, Model Town)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddServiceArea())}
                />
                <button type="button" onClick={handleAddServiceArea} className="add-area-btn">
                  Add Area
                </button>
              </div>
              
              {formData.location.serviceAreas.length > 0 && (
                <div className="areas-list">
                  {formData.location.serviceAreas.map((area, index) => (
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

        {/* Management Section */}
        <div className="form-section">
          <h3>Management</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Office Manager</label>
              <select
                name="managerId"
                value={formData.management.managerId}
                onChange={handleManagementChange}
              >
                <option value="">Select Manager</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} ({admin.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Staff Count</label>
              <input
                type="number"
                name="staffCount"
                value={formData.management.staffCount}
                onChange={handleManagementChange}
                min="0"
                placeholder="0"
              />
            </div>

            {formData.management.managerName && (
              <div className="form-group full-width">
                <div className="manager-info">
                  <strong>Selected Manager:</strong> {formData.management.managerName}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Office Details Section */}
        <div className="form-section">
          <h3>Office Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Office Type</label>
              <select
                name="type"
                value={formData.details.type}
                onChange={handleDetailsChange}
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
                value={formData.details.status}
                onChange={handleDetailsChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Facilities</label>
              <div className="facilities-input-group">
                <input
                  type="text"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  placeholder="Add facility (e.g., Parking, Waiting Area, WiFi)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFacility())}
                />
                <button type="button" onClick={handleAddFacility} className="add-facility-btn">
                  Add Facility
                </button>
              </div>
              
              {formData.details.facilities.length > 0 && (
                <div className="facilities-list">
                  {formData.details.facilities.map((facility, index) => (
                    <span key={index} className="facility-tag">
                      {facility}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFacility(facility)}
                        className="remove-facility"
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

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Adding Office...' : 'Add Office'}
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

export default AddOffice;