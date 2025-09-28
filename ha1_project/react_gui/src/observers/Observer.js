/**
 * Observer Pattern Implementation
 * 
 * This file implements the Observer pattern for the application,
 * allowing components to subscribe to data changes and receive notifications
 * when data is updated across the application.
 */

// Observer interface - components that want to be notified of changes
export class Observer {
  constructor(componentName) {
    this.componentName = componentName;
  }

  // Method that will be called when data changes
  update(dataType, data) {
    console.log(`${this.componentName} received update for ${dataType}:`, data);
    // This method will be overridden by components
  }

  // Method to handle specific data type updates
  onTeamsUpdate(teams) {
    // Override in components that need team updates
  }

  onCriteriaUpdate(criteria) {
    // Override in components that need criteria updates
  }

  onMarksUpdate(marks, teamId, roundId) {
    // Override in components that need marks updates
  }

  onRoundsUpdate(rounds) {
    // Override in components that need rounds updates
  }
}

// Subject interface - manages observers and notifies them of changes
export class Subject {
  constructor() {
    this.observers = [];
  }

  // Add an observer to the list
  addObserver(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
      console.log(`Observer ${observer.componentName} added`);
    }
  }

  // Remove an observer from the list
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
      console.log(`Observer ${observer.componentName} removed`);
    }
  }

  // Notify all observers of a change
  notifyObservers(dataType, data) {
    console.log(`Notifying ${this.observers.length} observers of ${dataType} change`);
    this.observers.forEach(observer => {
      try {
        observer.update(dataType, data);
        
        // Call specific update methods based on data type
        switch (dataType) {
          case 'teams':
            observer.onTeamsUpdate(data);
            break;
          case 'criteria':
            observer.onCriteriaUpdate(data);
            break;
          case 'marks':
            observer.onMarksUpdate(data.marks, data.teamId, data.roundId);
            break;
          case 'rounds':
            observer.onRoundsUpdate(data);
            break;
          default:
            console.warn(`Unknown data type: ${dataType}`);
        }
      } catch (error) {
        console.error(`Error notifying observer ${observer.componentName}:`, error);
      }
    });
  }

  // Get the number of observers
  getObserverCount() {
    return this.observers.length;
  }
}

// Data Store that implements the Subject pattern
export class DataStore extends Subject {
  constructor() {
    super();
    this.data = {
      teams: [],
      criteria: [],
      rounds: [],
      marks: {} // Structure: { teamId: { roundId: { marks } } }
    };
  }

  // Update teams data and notify observers
  updateTeams(teams) {
    this.data.teams = teams;
    this.notifyObservers('teams', teams);
  }

  // Update criteria data and notify observers
  updateCriteria(criteria) {
    this.data.criteria = criteria;
    this.notifyObservers('criteria', criteria);
  }

  // Update rounds data and notify observers
  updateRounds(rounds) {
    this.data.rounds = rounds;
    this.notifyObservers('rounds', rounds);
  }

  // Update marks data and notify observers
  updateMarks(teamId, roundId, marks) {
    if (!this.data.marks[teamId]) {
      this.data.marks[teamId] = {};
    }
    this.data.marks[teamId][roundId] = marks;
    this.notifyObservers('marks', { marks, teamId, roundId });
  }

  // Get current data
  getData() {
    return this.data;
  }

  // Get specific data type
  getTeams() {
    return this.data.teams;
  }

  getCriteria() {
    return this.data.criteria;
  }

  getRounds() {
    return this.data.rounds;
  }

  getMarks(teamId, roundId) {
    return this.data.marks[teamId]?.[roundId] || null;
  }
}

// Create a singleton instance of the data store
export const dataStore = new DataStore();
