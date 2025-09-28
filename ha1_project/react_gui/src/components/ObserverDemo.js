/**
 * Observer Pattern Demo Component
 * 
 * This component demonstrates how the Observer pattern works in the application.
 * It shows real-time updates when data changes across different components.
 */

import React, { useState, useEffect } from 'react';
import { useAllDataObserver } from '../hooks/useObserver';
import { dataStore } from '../observers/Observer';
import { CriteriaObserverService, TeamsObserverService } from '../services/observer_services';

function ObserverDemo() {
  const { data, loading, error, refreshData } = useAllDataObserver('ObserverDemo');
  const [notifications, setNotifications] = useState([]);
  const [observerCount, setObserverCount] = useState(0);

  // Update observer count
  useEffect(() => {
    const updateObserverCount = () => {
      setObserverCount(dataStore.getObserverCount());
    };
    
    updateObserverCount();
    const interval = setInterval(updateObserverCount, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Add notification when data changes
  useEffect(() => {
    const addNotification = (type, data) => {
      const notification = {
        id: Date.now(),
        type,
        timestamp: new Date().toLocaleTimeString(),
        data: Array.isArray(data) ? data.length : Object.keys(data || {}).length
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    };

    // This would be called by the observer system
    // For demo purposes, we'll simulate it
  }, []);

  const handleTestCriteriaUpdate = async () => {
    try {
      // Create a test criteria to demonstrate observer pattern
      const testCriteria = {
        beskrywing: `Test Kriteria ${Date.now()}`,
        default_totaal: Math.floor(Math.random() * 100) + 1
      };
      
      await CriteriaObserverService.createCriteria(testCriteria);
      
      setNotifications(prev => [{
        id: Date.now(),
        type: 'criteria_created',
        timestamp: new Date().toLocaleTimeString(),
        data: testCriteria.beskrywing
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Error creating test criteria:', error);
    }
  };

  const handleTestTeamUpdate = async () => {
    try {
      // Refresh teams to demonstrate observer pattern
      await TeamsObserverService.loadTeams();
      
      setNotifications(prev => [{
        id: Date.now(),
        type: 'teams_refreshed',
        timestamp: new Date().toLocaleTimeString(),
        data: data.teams.length
      }, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Error refreshing teams:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Observer Pattern Demo</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h3>Data Status</h3>
          <p><strong>Teams:</strong> {data.teams.length}</p>
          <p><strong>Criteria:</strong> {data.criteria.length}</p>
          <p><strong>Rounds:</strong> {data.rounds.length}</p>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>Error:</strong> {error || 'None'}</p>
        </div>
        
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h3>Observer Status</h3>
          <p><strong>Active Observers:</strong> {observerCount}</p>
          <p><strong>Component:</strong> ObserverDemo</p>
          <p><strong>Pattern:</strong> Observer Pattern</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Actions</h3>
        <button 
          onClick={handleTestCriteriaUpdate}
          style={{ marginRight: '10px', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
        >
          Create Test Criteria
        </button>
        <button 
          onClick={handleTestTeamUpdate}
          style={{ marginRight: '10px', padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}
        >
          Refresh Teams
        </button>
        <button 
          onClick={refreshData}
          style={{ marginRight: '10px', padding: '10px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '3px' }}
        >
          Refresh All Data
        </button>
        <button 
          onClick={clearNotifications}
          style={{ padding: '10px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
        >
          Clear Notifications
        </button>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h3>Real-time Notifications</h3>
        {notifications.length === 0 ? (
          <p>No notifications yet. Try the test actions above.</p>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {notifications.map(notification => (
              <div 
                key={notification.id}
                style={{ 
                  padding: '5px', 
                  margin: '5px 0', 
                  backgroundColor: '#f8f9fa', 
                  borderLeft: '3px solid #007bff',
                  fontSize: '14px'
                }}
              >
                <strong>{notification.timestamp}</strong> - {notification.type}: {notification.data}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
        <h4>How the Observer Pattern Works:</h4>
        <ul>
          <li><strong>Subject:</strong> The DataStore manages a list of observers and notifies them when data changes</li>
          <li><strong>Observer:</strong> Components subscribe to the DataStore and receive automatic updates</li>
          <li><strong>Decoupling:</strong> Components don't need to know about each other - they just react to data changes</li>
          <li><strong>Real-time:</strong> When one component changes data, all other components are automatically updated</li>
          <li><strong>Scalable:</strong> Easy to add new components that need to react to data changes</li>
        </ul>
      </div>
    </div>
  );
}

export default ObserverDemo;
