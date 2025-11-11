import React, { useState, useEffect } from 'react';
import './ViewWorkers.css';
import { collection, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ViewWorkers = () => {
    const [workers, setWorkers] = useState([]);
    const [filteredWorkers, setFilteredWorkers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        category: 'all',
        status: 'all',
        verification: 'all'
    });

    // Fetch workers and categories
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
                                    <span className="detail-label">Added By:</span>
                                    <span className="detail-value admin-name">
                                        {worker.addedBy?.adminName || 'System'}
                                    </span>
                                </div>
                            </div>

                            <div className="worker-actions">
                                <button className="action-btn view-btn">View Profile</button>
                                <button className="action-btn verify-btn">Verify</button>
                                <button className="action-btn edit-btn">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ViewWorkers;