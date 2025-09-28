
import React, { useState, useEffect } from 'react';
import { 
  fetchAllCriteria, 
  createCriteria, 
  updateCriteria, 
  deleteCriteria 
} from '../services/criteria_services';
import './merkadmin.css';

function MerkAdmin() {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [formData, setFormData] = useState({
    beskrywing: '',
    default_totaal: 100
  });

  // Load criteria on component mount
  useEffect(() => {
    loadCriteria();
  }, []);

  const loadCriteria = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllCriteria();
      setCriteria(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'default_totaal' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.beskrywing.trim()) {
      setError('Beskrywing is verpligtend');
      return;
    }
    
    if (formData.default_totaal <= 0) {
      setError('Default totaal moet groter as 0 wees');
      return;
    }

    try {
      setError(null);
      
      if (editingCriteria) {
        // Update existing criteria
        await updateCriteria(editingCriteria.kriteria_id, formData);
        setEditingCriteria(null);
      } else {
        // Create new criteria
        await createCriteria(formData);
      }
      
      // Reset form and reload criteria
      setFormData({ beskrywing: '', default_totaal: 100 });
      setShowForm(false);
      await loadCriteria();
      
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (criteriaItem) => {
    setEditingCriteria(criteriaItem);
    setFormData({
      beskrywing: criteriaItem.beskrywing,
      default_totaal: criteriaItem.default_totaal
    });
    setShowForm(true);
  };

  const handleDelete = async (criteriaId, beskrywing) => {
    if (window.confirm(`Is jy seker jy wil "${beskrywing}" verwyder?`)) {
      try {
        setError(null);
        await deleteCriteria(criteriaId);
        await loadCriteria();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCriteria(null);
    setFormData({ beskrywing: '', default_totaal: 100 });
    setError(null);
  };

  const handleAddNew = () => {
    setEditingCriteria(null);
    setFormData({ beskrywing: '', default_totaal: 100 });
    setShowForm(true);
    setError(null);
  };

  if (loading) {
    return (
      <div className="merkadmin-container">
        <div className="loading">Laai kriteria...</div>
      </div>
    );
  }

  return (
    <div className="merkadmin-container">
      <div className="merkadmin-header">
        <h1>Merk Kriteria Bestuur</h1>
        <p>Beheer die kriteria wat gebruik word vir die beoordeling van spanne</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="merkadmin-actions">
        <button 
          className="btn btn-primary"
          onClick={handleAddNew}
        >
          + Skep Nuwe Kriteria
        </button>
                 <button
                   className="btn btn-secondary"
                   onClick={loadCriteria}
                 >
                   Herlaai
                 </button>
      </div>

      {showForm && (
        <div className="criteria-form-container">
          <div className="criteria-form">
            <h3>{editingCriteria ? 'Wysig Kriteria' : 'Skep Nuwe Kriteria'}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="beskrywing">Beskrywing:</label>
                <input
                  type="text"
                  id="beskrywing"
                  name="beskrywing"
                  value={formData.beskrywing}
                  onChange={handleInputChange}
                  placeholder="Byvoorbeeld: Backend Development"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="default_totaal">Default Totaal:</label>
                <input
                  type="number"
                  id="default_totaal"
                  name="default_totaal"
                  value={formData.default_totaal}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                  required
                />
                <small>Maksimum punte wat vir hierdie kriteria toegeken kan word</small>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingCriteria ? 'Opdateer' : 'Skep'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Kanselleer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="criteria-list">
        <h3>Bestaande Kriteria ({criteria.length})</h3>
        
        {criteria.length === 0 ? (
          <div className="no-criteria">
            <p>Geen kriteria gevind nie. Skep die eerste kriteria hierbo.</p>
          </div>
        ) : (
          <div className="criteria-grid">
            {criteria.map((item) => (
              <div key={item.kriteria_id} className="criteria-card">
                <div className="criteria-header">
                  <h4>{item.beskrywing}</h4>
                  <span className="criteria-id">ID: {item.kriteria_id}</span>
                </div>
                
                <div className="criteria-details">
                  <div className="criteria-detail">
                    <strong>Default Totaal:</strong>
                    <span>{item.default_totaal} punte</span>
                  </div>
                </div>

                <div className="criteria-actions">
                           <button
                             className="btn btn-edit"
                             onClick={() => handleEdit(item)}
                             title="Wysig kriteria"
                           >
                             Wysig
                           </button>
                  <button 
                    className="btn btn-delete"
                    onClick={() => handleDelete(item.kriteria_id, item.beskrywing)}
                    title="Verwyder kriteria"
                  >
                    Verwyder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MerkAdmin;
