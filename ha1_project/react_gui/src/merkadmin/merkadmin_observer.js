/**
 * MerkAdmin Component with Observer Pattern
 * 
 * This is an example of how to convert an existing component to use the Observer pattern.
 * This version automatically receives updates when criteria change across the application.
 */

import React, { useState, useEffect } from 'react';
import { useCriteriaObserver } from '../hooks/useObserver';
import { CriteriaObserverService } from '../services/observer_services';
import './merkadmin.css';

function MerkAdminObserver() {
  const { data, loading, error, refreshData } = useCriteriaObserver('MerkAdmin');
  const [showForm, setShowForm] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(null);
  const [formData, setFormData] = useState({
    beskrywing: '',
    default_totaal: 100
  });

  // Load initial criteria data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await CriteriaObserverService.loadCriteria();
      } catch (err) {
        console.error('Error loading initial criteria:', err);
      }
    };
    
    loadInitialData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'default_totaal' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.beskrywing.trim()) {
      alert('Beskrywing is verpligtend');
      return;
    }

    try {
      if (editingCriteria) {
        // Update existing criteria
        await CriteriaObserverService.updateCriteria(editingCriteria.kriteria_id, formData);
        setEditingCriteria(null);
      } else {
        // Create new criteria
        await CriteriaObserverService.createCriteria(formData);
      }
      
      // Reset form
      setFormData({ beskrywing: '', default_totaal: 100 });
      setShowForm(false);
    } catch (err) {
      console.error('Error saving criteria:', err);
      alert('Fout met stoor van kriteria: ' + err.message);
    }
  };

  const handleEdit = (criteria) => {
    setEditingCriteria(criteria);
    setFormData({
      beskrywing: criteria.beskrywing,
      default_totaal: criteria.default_totaal
    });
    setShowForm(true);
  };

  const handleDelete = async (criteriaId, beskrywing) => {
    if (window.confirm(`Is jy seker jy wil "${beskrywing}" verwyder?\n\nDit sal ook alle verwante merkblaaie en punte verwyder.`)) {
      try {
        await CriteriaObserverService.deleteCriteria(criteriaId);
      } catch (err) {
        console.error('Error deleting criteria:', err);
        alert('Fout met verwyder van kriteria: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCriteria(null);
    setFormData({ beskrywing: '', default_totaal: 100 });
  };

  const handleAddNew = () => {
    setEditingCriteria(null);
    setFormData({ beskrywing: '', default_totaal: 100 });
    setShowForm(true);
  };

  // Get criteria from observer data
  const criteria = data.criteria || [];

  return (
    <div className="merk-admin-container">
      <div className="admin-header">
        <h1>Merk Kriteria Bestuur</h1>
        <p>Bestuur die kriteria wat gebruik word vir beoordeling</p>
      </div>

      <div className="admin-actions">
        <button 
          onClick={handleAddNew}
          className="add-button"
          disabled={loading}
        >
          Skep Nuwe Kriteria
        </button>
        <button 
          onClick={refreshData}
          className="refresh-button"
          disabled={loading}
        >
          {loading ? 'Herlaai...' : 'Herlaai'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <h2>{editingCriteria ? 'Wysig Kriteria' : 'Skep Nuwe Kriteria'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="beskrywing">Beskrywing:</label>
              <input
                type="text"
                id="beskrywing"
                name="beskrywing"
                value={formData.beskrywing}
                onChange={handleInputChange}
                required
                placeholder="Voer kriteria beskrywing in"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="default_totaal">Maksimum Punte:</label>
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
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-button">
                {editingCriteria ? 'Wysig' : 'Skep'}
              </button>
              <button type="button" onClick={handleCancel} className="cancel-button">
                Kanselleer
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="criteria-list">
        <h2>Bestaande Kriteria</h2>
        {loading ? (
          <div className="loading">Laai kriteria...</div>
        ) : criteria.length === 0 ? (
          <div className="no-data">Geen kriteria gevind nie</div>
        ) : (
          <div className="criteria-grid">
            {criteria.map((criteria) => (
              <div key={criteria.kriteria_id} className="criteria-card">
                <div className="criteria-header">
                  <h3>{criteria.beskrywing}</h3>
                  <span className="max-points">{criteria.default_totaal} punte</span>
                </div>
                <div className="criteria-actions">
                  <button 
                    onClick={() => handleEdit(criteria)}
                    className="edit-button"
                  >
                    Wysig
                  </button>
                  <button 
                    onClick={() => handleDelete(criteria.kriteria_id, criteria.beskrywing)}
                    className="delete-button"
                  >
                    Verwyder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="observer-info">
        <p><strong>Observer Pattern Active:</strong> This component automatically receives updates when criteria change in other parts of the application.</p>
        <p><strong>Observers Connected:</strong> {dataStore.getObserverCount()}</p>
      </div>
    </div>
  );
}

export default MerkAdminObserver;
