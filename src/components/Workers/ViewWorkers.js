import React, { useState, useEffect } from 'react';
import './ViewWorkers.css';
import { collection, getDocs, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ViewWorkers = () => {
    const [workers, setWorkers] = useState([]);
    const [filteredWorkers, setFilteredWorkers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        status: 'all',
        verification: 'all'
    });

    // Edit modal state
    const [editingWorker, setEditingWorker] = useState(null);
    const [editForm, setEditForm] = useState({
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
        }
    });
    const [newSkill, setNewSkill] = useState('');

    // Fetch workers, categories, and offices
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch categories
                const categoriesSnapshot = await getDocs(collection(db, 'workCategories'));
                const categoriesData = categoriesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategories(categoriesData);

                // Fetch offices
                const officesSnapshot = await getDocs(collection(db, 'offices'));
                const officesData = officesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setOffices(officesData);

                // Real-time workers listener
                const unsubscribe = onSnapshot(collection(db, 'workers'), (snapshot) => {
                    const workersData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setWorkers(workersData);
                    setFilteredWorkers(workersData);
                    setLoading(false);
                });

                return unsubscribe;
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = workers;

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(worker =>
                worker.personalInfo.name.toLowerCase().includes(searchLower) ||
                worker.personalInfo.phone.includes(filters.search) ||
                worker.workInfo.skills.some(skill => skill.toLowerCase().includes(searchLower))
            );
        }

        // Category filter
        if (filters.category !== 'all') {
            result = result.filter(worker => worker.workInfo.categoryId === filters.category);
        }

        // Verification status filter
        if (filters.verification !== 'all') {
            result = result.filter(worker => worker.verification.status === filters.verification);
        }

        setFilteredWorkers(result);
    }, [filters, workers]);

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            category: 'all',
            status: 'all',
            verification: 'all'
        });
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? `${category.icon} ${category.name}` : 'Unknown Category';
    };

    const getStatusBadge = (worker) => {
        const status = worker.verification.status;
        const badgeClass = {
            'pending': 'status-pending',
            'verified': 'status-verified',
            'rejected': 'status-rejected'
        }[status] || 'status-pending';

        return (
            <span className={`status-badge ${badgeClass}`}>
                {status}
            </span>
        );
    };

    // Calculate age from date of birth
    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
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
                name: worker.personalInfo.name || '',
                phone: worker.personalInfo.phone || '',
                cnic: worker.personalInfo.cnic || '',
                address: worker.personalInfo.address || '',
                email: worker.personalInfo.email || '',
                dateOfBirth: worker.personalInfo.dateOfBirth || ''
            },
            workInfo: {
                categoryId: worker.workInfo.categoryId || '',
                skills: [...(worker.workInfo.skills || [])],
                experience: worker.workInfo.experience || '',
                serviceRadius: worker.workInfo.serviceRadius || 10,
                availability: worker.workInfo.availability || 'full-time',
                officeId: worker.officeInfo?.officeId || ''
            }
        });
        setNewSkill('');
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingWorker(null);
        setEditForm({
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
            }
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

    const handleSkillKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    // Update worker
    const updateWorker = async (workerId) => {
    try {
        // Get selected office details
        const selectedOffice = offices.find(office => office.id === editForm.workInfo.officeId);
        
        const updateData = {
            'personalInfo.name': editForm.personalInfo.name,
            'personalInfo.phone': editForm.personalInfo.phone,
            'personalInfo.cnic': editForm.personalInfo.cnic,
            'personalInfo.address': editForm.personalInfo.address,
            'personalInfo.email': editForm.personalInfo.email,
            'personalInfo.dateOfBirth': editForm.personalInfo.dateOfBirth,
            'workInfo.categoryId': editForm.workInfo.categoryId,
            'workInfo.skills': editForm.workInfo.skills,
            'workInfo.experience': editForm.workInfo.experience,
            'workInfo.serviceRadius': editForm.workInfo.serviceRadius,
            'workInfo.availability': editForm.workInfo.availability,
            'workInfo.officeId': editForm.workInfo.officeId,
            'officeInfo': {
                officeId: editForm.workInfo.officeId,
                officeName: selectedOffice?.basicInfo?.name || 'Unknown Office',
                officeCity: selectedOffice?.basicInfo?.city || 'Unknown City'
            },
            // NEW: Reset verification status to pending when worker is updated
            'verification.status': 'pending',
            'verification.rejectionReason': '', // Clear any previous rejection reason
            'verification.lastUpdated': new Date(),
            'updatedAt': new Date()
        };

        await updateDoc(doc(db, 'workers', workerId), updateData);
        setEditingWorker(null);
        alert('✅ Worker updated successfully! Worker status reset to pending for verification.');
    } catch (error) {
        console.error('Error updating worker:', error);
        alert('❌ Error updating worker: ' + error.message);
    }
};

    // Get selected office for display
    const getSelectedOffice = () => {
        return offices.find(office => office.id === editForm.workInfo.officeId);
    };

    // Calculate age for display
    const displayAge = editForm.personalInfo.dateOfBirth 
        ? ` (${calculateAge(editForm.personalInfo.dateOfBirth)} years old)`
        : '';

    if (loading) {
        return (
            <div className="view-workers-container">
                <div className="loading-state">Loading workers...</div>
            </div>
        );
    }

    return (
        <div className="view-workers-container">
            <div className="view-workers-header">
                <h2>View Workers</h2>
                <p>Manage and monitor all service providers in the system</p>
            </div>

            {/* Statistics Cards */}
            <div className="workers-stats">
                <div className="stat-card">
                    <span className="stat-number">{workers.length}</span>
                    <span className="stat-label">Total Workers</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {workers.filter(w => w.verification.status === 'verified').length}
                    </span>
                    <span className="stat-label">Verified</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {workers.filter(w => w.verification.status === 'pending').length}
                    </span>
                    <span className="stat-label">Pending</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">
                        {categories.length}
                    </span>
                    <span className="stat-label">Categories</span>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
                <div className="filters-grid">
                    {/* Search */}
                    <div className="filter-group">
                        <label>Search Workers</label>
                        <input
                            type="text"
                            placeholder="Search by name, phone, or skills..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="filter-group">
                        <label>Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.icon} {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Verification Filter */}
                    <div className="filter-group">
                        <label>Verification Status</label>
                        <select
                            value={filters.verification}
                            onChange={(e) => handleFilterChange('verification', e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    <div className="filter-group">
                        <label>&nbsp;</label>
                        <button onClick={clearFilters} className="clear-filters-btn">
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Results Count */}
                <div className="results-count">
                    Showing {filteredWorkers.length} of {workers.length} workers
                </div>
            </div>

            {/* Workers Grid */}
            {filteredWorkers.length === 0 ? (
                <div className="empty-state">
                    <p>No workers found matching your filters.</p>
                    <button onClick={clearFilters} className="clear-filters-btn">
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="workers-grid">
                    {filteredWorkers.map(worker => (
                        <div key={worker.id} className="worker-card">
                            <div className="worker-header">
                                <div className="worker-avatar">
                                    {worker.personalInfo.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="worker-basic-info">
                                    <h4 className="worker-name">{worker.personalInfo.name}</h4>
                                    <p className="worker-phone">{worker.personalInfo.phone}</p>
                                </div>
                                {getStatusBadge(worker)}
                            </div>

                            <div className="worker-details">
                                <div className="detail-item">
                                    <span className="detail-label">Category:</span>
                                    <span className="detail-value">
                                        {getCategoryName(worker.workInfo.categoryId)}
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Experience:</span>
                                    <span className="detail-value">
                                        {worker.workInfo.experience || 'Not specified'}
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Skills:</span>
                                    <div className="skills-preview">
                                        {worker.workInfo.skills.slice(0, 3).map((skill, index) => (
                                            <span key={index} className="skill-tag small">
                                                {skill}
                                            </span>
                                        ))}
                                        {worker.workInfo.skills.length > 3 && (
                                            <span className="more-skills">+{worker.workInfo.skills.length - 3} more</span>
                                        )}
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Office:</span>
                                    <span className="detail-value">
                                        {worker.officeInfo?.officeName || 'Not assigned'}
                                    </span>
                                </div>

                                <div className="detail-item">
                                    <span className="detail-label">Added By:</span>
                                    <span className="detail-value admin-name">
                                        {worker.addedBy?.adminName || 'System'}
                                    </span>
                                </div>
                            </div>

                            <div className="worker-actions">
                                <button className="action-btn view-btn">View Profile</button>
                                <button 
                                    className="action-btn edit-btn"
                                    onClick={() => startEdit(worker)}
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Enhanced Edit Modal */}
            {editingWorker && (
                <div className="modal-overlay" onClick={cancelEdit}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Worker</h3>
                            <button className="close-btn" onClick={cancelEdit}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Personal Information Section */}
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
                                        <label>Phone Number *</label>
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
                                        <label>CNIC Number</label>
                                        <input
                                            type="text"
                                            name="cnic"
                                            value={editForm.personalInfo.cnic}
                                            onChange={handlePersonalInfoChange}
                                            className="form-input"
                                            placeholder="12345-6789012-3"
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
                                        {editForm.personalInfo.dateOfBirth && (
                                            <div className="form-help">{displayAge}</div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={editForm.personalInfo.email}
                                            onChange={handlePersonalInfoChange}
                                            className="form-input"
                                            placeholder="worker@example.com"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Address</label>
                                        <textarea
                                            name="address"
                                            value={editForm.personalInfo.address}
                                            onChange={handlePersonalInfoChange}
                                            className="form-input"
                                            placeholder="Full residential address"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Work Information Section */}
                            <div className="form-section">
                                <h4>Work Information</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Work Category *</label>
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
                                        <label>Assigned Office *</label>
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
                                                onKeyPress={handleSkillKeyPress}
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

                            {/* Office Information Display */}
                            {editForm.workInfo.officeId && (
                                <div className="form-section">
                                    <h4>Office Information</h4>
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

export default ViewWorkers;