import React, { useState, useEffect } from 'react';
import './ViewCategories.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ViewCategories = () => {
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories and workers for real-time counts
  useEffect(() => {
    // Real-time categories listener
    const categoriesUnsubscribe = onSnapshot(collection(db, 'workCategories'), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    });

    // Real-time workers listener to count by category
    const workersUnsubscribe = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkers(workersData);
      setLoading(false);
    });

    return () => {
      categoriesUnsubscribe();
      workersUnsubscribe();
    };
  }, []);

  // Calculate worker count for each category
  const getWorkerCountForCategory = (categoryId) => {
    return workers.filter(worker => worker.workInfo?.categoryId === categoryId).length;
  };

  // Get verified worker count for each category
  const getVerifiedWorkerCountForCategory = (categoryId) => {
    return workers.filter(worker => 
      worker.workInfo?.categoryId === categoryId && 
      worker.verification?.status === 'verified'
    ).length;
  };

  // Calculate total statistics
  const totalWorkers = workers.length;
  const totalVerifiedWorkers = workers.filter(w => w.verification?.status === 'verified').length;
  const activeCategories = categories.filter(cat => cat.status === 'active').length;

  if (loading) {
    return (
      <div className="view-categories-container">
        <div className="loading-state">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="view-categories-container">
      {/* REMOVED: Header since ContentDisplay handles it */}

      {/* UPDATED: Statistics with real-time counts */}
      <div className="categories-stats">
        <div className="stat-card">
          <span className="stat-number">{categories.length}</span>
          <span className="stat-label">Total Categories</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{totalWorkers}</span>
          <span className="stat-label">Total Workers</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{activeCategories}</span>
          <span className="stat-label">Active Categories</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{totalVerifiedWorkers}</span>
          <span className="stat-label">Verified Workers</span>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>No categories found in the system.</p>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map(category => {
            const totalWorkers = getWorkerCountForCategory(category.id);
            const verifiedWorkers = getVerifiedWorkerCountForCategory(category.id);
            
            return (
              <div key={category.id} className="category-card view-only">
                <div className="category-header">
                  <span className="category-icon">{category.icon}</span>
                  <h4 className="category-name">{category.name}</h4>
                  <span className={`status-badge ${category.status}`}>
                    {category.status}
                  </span>
                </div>
                
                {category.description && (
                  <p className="category-description">{category.description}</p>
                )}
                
                {/* UPDATED: Worker statistics with real-time counts */}
                <div className="category-stats">
                  <div className="worker-count">
                    <strong>{totalWorkers}</strong> total workers
                  </div>
                  <div className="verified-count">
                    <strong>{verifiedWorkers}</strong> verified
                  </div>
                  <div className="pending-count">
                    <strong>{totalWorkers - verifiedWorkers}</strong> pending
                  </div>
                  <span className="created-date">
                    Created: {category.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ViewCategories;