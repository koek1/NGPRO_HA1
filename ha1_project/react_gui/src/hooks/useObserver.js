/**
 * useObserver Hook
 * 
 * This React hook makes it easy for components to subscribe to the Observer pattern
 * and automatically receive updates when data changes.
 */

import { useEffect, useRef, useState } from 'react';
import { dataStore } from '../observers/Observer';

/**
 * Custom hook for components to subscribe to data changes
 * @param {string} componentName - Name of the component for debugging
 * @param {Object} options - Configuration options
 * @returns {Object} - Data and methods for the component
 */
export const useObserver = (componentName, options = {}) => {
  const [data, setData] = useState({
    teams: [],
    criteria: [],
    rounds: [],
    marks: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const observerRef = useRef(null);

  // Create observer instance
  useEffect(() => {
    observerRef.current = {
      componentName,
      update: (dataType, newData) => {
        console.log(`${componentName} received update for ${dataType}`);
        setData(prevData => ({
          ...prevData,
          [dataType]: newData
        }));
      },
      onTeamsUpdate: (teams) => {
        if (options.onTeamsUpdate) {
          options.onTeamsUpdate(teams);
        }
        setData(prevData => ({ ...prevData, teams }));
      },
      onCriteriaUpdate: (criteria) => {
        if (options.onCriteriaUpdate) {
          options.onCriteriaUpdate(criteria);
        }
        setData(prevData => ({ ...prevData, criteria }));
      },
      onMarksUpdate: (marks, teamId, roundId) => {
        if (options.onMarksUpdate) {
          options.onMarksUpdate(marks, teamId, roundId);
        }
        setData(prevData => ({
          ...prevData,
          marks: {
            ...prevData.marks,
            [teamId]: {
              ...prevData.marks[teamId],
              [roundId]: marks
            }
          }
        }));
      },
      onRoundsUpdate: (rounds) => {
        if (options.onRoundsUpdate) {
          options.onRoundsUpdate(rounds);
        }
        setData(prevData => ({ ...prevData, rounds }));
      }
    };

    // Subscribe to data store
    dataStore.addObserver(observerRef.current);

    // Load initial data if not already loaded
    const currentData = dataStore.getData();
    if (currentData.teams.length === 0 && currentData.criteria.length === 0) {
      setLoading(true);
      // This will be handled by the component's useEffect
    } else {
      setData(currentData);
    }

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        dataStore.removeObserver(observerRef.current);
      }
    };
  }, [componentName, options]);

  // Helper methods
  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Import here to avoid circular dependencies
      const { ObserverService } = await import('../services/observer_services');
      await ObserverService.refreshAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTeams = () => data.teams;
  const getCriteria = () => data.criteria;
  const getRounds = () => data.rounds;
  const getMarks = (teamId, roundId) => data.marks[teamId]?.[roundId] || null;

  return {
    data,
    loading,
    error,
    refreshData,
    getTeams,
    getCriteria,
    getRounds,
    getMarks
  };
};

/**
 * Hook specifically for teams data
 */
export const useTeamsObserver = (componentName) => {
  return useObserver(componentName, {
    onTeamsUpdate: (teams) => {
      console.log(`${componentName} teams updated:`, teams.length);
    }
  });
};

/**
 * Hook specifically for criteria data
 */
export const useCriteriaObserver = (componentName) => {
  return useObserver(componentName, {
    onCriteriaUpdate: (criteria) => {
      console.log(`${componentName} criteria updated:`, criteria.length);
    }
  });
};

/**
 * Hook specifically for marks data
 */
export const useMarksObserver = (componentName) => {
  return useObserver(componentName, {
    onMarksUpdate: (marks, teamId, roundId) => {
      console.log(`${componentName} marks updated for team ${teamId}, round ${roundId}:`, marks);
    }
  });
};

/**
 * Hook for all data types
 */
export const useAllDataObserver = (componentName) => {
  return useObserver(componentName, {
    onTeamsUpdate: (teams) => {
      console.log(`${componentName} teams updated:`, teams.length);
    },
    onCriteriaUpdate: (criteria) => {
      console.log(`${componentName} criteria updated:`, criteria.length);
    },
    onMarksUpdate: (marks, teamId, roundId) => {
      console.log(`${componentName} marks updated for team ${teamId}, round ${roundId}:`, marks);
    },
    onRoundsUpdate: (rounds) => {
      console.log(`${componentName} rounds updated:`, rounds.length);
    }
  });
};
