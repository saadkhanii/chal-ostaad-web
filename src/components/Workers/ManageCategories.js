import React, { useState, useEffect } from 'react';
import './ManageCategories.css';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🔧'
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  // Icons for different categories
  const categoryIcons = ['🔧', '⚡', '💧', '🧹', '🎨', '🔨', '🚗', '👷', '🔩', '📱'];

  // Fetch categories and workers
  useEffect(() => {
    const categoriesUnsubscribe = onSnapshot(collection(db, 'workCategories'), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    });

    const workersUnsubscribe = onSnapshot(collection(db, 'workers'), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWorkers(workersData);
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage('❌ Category name is required!');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'workCategories', editingId), {
          ...formData,
          updatedAt: new Date()
        });
        setMessage('✅ Category updated successfully!');
      } else {
        await addDoc(collection(db, 'workCategories'), {
          ...formData,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setMessage('✅ Category added successfully!');
      }

      setFormData({ name: '', description: '', icon: '🔧' });
      setEditingId(null);
      
    } catch (error) {
      console.error('Error saving category:', error);
      setMessage('❌ Error saving category: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '🔧'
    });
    setEditingId(category.id);
    setMessage('');
  };

  const handleDelete = async (categoryId) => {
    const workerCount = getWorkerCountForCategory(categoryId);
    if (workerCount > 0) {
      setMessage(`❌ Cannot delete category! There are ${workerCount} workers assigned to this category.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'workCategories', categoryId));
      setMessage('✅ Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      setMessage('❌ Error deleting category: ' + error.message);
    }
  };

  const cancelEdit = () => {
    setFormData({ name: '', description: '', icon: '🔧' });
    setEditingId(null);
    setMessage('');
  };

  return (
    <div className="manage-categories-container">
      <div className="categories-header">
        <h2>Manage Categories</h2>
        <p>Create and manage service categories for workers</p>
      </div>

      <div className="categories-layout">
        {/* Add/Edit Form */}
        <div className="category-form-section">
          <h3>{editingId ? 'Edit Category' : 'Add New Category'}</h3>
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-group">
              <label>Category Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Electrician, Plumber, Cleaner"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this category..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Icon</label>
              <div className="icon-selector">
                {categoryIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={loading}
                className="submit-btn"
              >
                {loading ? 'Saving...' : editingId ? 'Update Category' : 'Add Category'}
              </button>
              
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
          </form>
        </div>

        {/* Categories List */}
        <div className="categories-list-section">
          <h3>Existing Categories ({categories.length})</h3>
          
          {categories.length === 0 ? (
            <div className="empty-state">
              <p>No categories found. Add your first category!</p>
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map(category => {
                const totalWorkers = getWorkerCountForCategory(category.id);
                const verifiedWorkers = getVerifiedWorkerCountForCategory(category.id);
                
                return (
                  <div key={category.id} className="category-card">
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
                    
                    <div className="category-stats">
                      <div className="worker-count">
                        <strong>{totalWorkers}</strong> total workers
                      </div>
                      <div className="verified-count">
                        <strong>{verifiedWorkers}</strong> verified
                      </div>
                    </div>

                    <div className="category-actions">
                      <button 
                        onClick={() => handleEdit(category)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;