/**
 * Observer Services
 * 
 * This file provides services that integrate with the Observer pattern,
 * automatically notifying observers when data changes occur.
 */

import { dataStore } from '../observers/Observer';
import { 
  fetchAllTeams, 
  fetchTeam, 
  createTeam, 
  updateTeam, 
  deleteTeam 
} from './span_services';
import { 
  fetchAllCriteria, 
  createCriteria, 
  updateCriteria, 
  deleteCriteria 
} from './criteria_services';
import { 
  fetchRounds, 
  fetchTeamsWithMarks, 
  closeRound, 
  fetchWinner 
} from './beoordelaar_services';
import { 
  submitMarks, 
  fetchTeamMarks 
} from './merk_services';

/**
 * Teams Observer Service
 */
export class TeamsObserverService {
  // Load all teams and notify observers
  static async loadTeams(roundId = null) {
    try {
      const teams = await fetchAllTeams(roundId);
      dataStore.updateTeams(teams);
      return teams;
    } catch (error) {
      console.error('Error loading teams:', error);
      throw error;
    }
  }

  // Create team and notify observers
  static async createTeam(teamData) {
    try {
      const newTeam = await createTeam(teamData);
      // Reload all teams to get updated list
      await this.loadTeams();
      return newTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  // Update team and notify observers
  static async updateTeam(teamId, teamData) {
    try {
      const updatedTeam = await updateTeam(teamId, teamData);
      // Reload all teams to get updated list
      await this.loadTeams();
      return updatedTeam;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  // Delete team and notify observers
  static async deleteTeam(teamId) {
    try {
      await deleteTeam(teamId);
      // Reload all teams to get updated list
      await this.loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }
}

/**
 * Criteria Observer Service
 */
export class CriteriaObserverService {
  // Load all criteria and notify observers
  static async loadCriteria() {
    try {
      const criteria = await fetchAllCriteria();
      dataStore.updateCriteria(criteria);
      return criteria;
    } catch (error) {
      console.error('Error loading criteria:', error);
      throw error;
    }
  }

  // Create criteria and notify observers
  static async createCriteria(criteriaData) {
    try {
      const newCriteria = await createCriteria(criteriaData);
      // Reload all criteria to get updated list
      await this.loadCriteria();
      return newCriteria;
    } catch (error) {
      console.error('Error creating criteria:', error);
      throw error;
    }
  }

  // Update criteria and notify observers
  static async updateCriteria(criteriaId, criteriaData) {
    try {
      const updatedCriteria = await updateCriteria(criteriaId, criteriaData);
      // Reload all criteria to get updated list
      await this.loadCriteria();
      return updatedCriteria;
    } catch (error) {
      console.error('Error updating criteria:', error);
      throw error;
    }
  }

  // Delete criteria and notify observers
  static async deleteCriteria(criteriaId) {
    try {
      await deleteCriteria(criteriaId);
      // Reload all criteria to get updated list
      await this.loadCriteria();
    } catch (error) {
      console.error('Error deleting criteria:', error);
      throw error;
    }
  }
}

/**
 * Rounds Observer Service
 */
export class RoundsObserverService {
  // Load all rounds and notify observers
  static async loadRounds() {
    try {
      const rounds = await fetchRounds();
      dataStore.updateRounds(rounds);
      return rounds;
    } catch (error) {
      console.error('Error loading rounds:', error);
      throw error;
    }
  }

  // Close round and notify observers
  static async closeRound(roundId) {
    try {
      const result = await closeRound(roundId);
      // Reload rounds to get updated status
      await this.loadRounds();
      return result;
    } catch (error) {
      console.error('Error closing round:', error);
      throw error;
    }
  }
}

/**
 * Marks Observer Service
 */
export class MarksObserverService {
  // Submit marks and notify observers
  static async submitMarks(teamId, roundId, marks) {
    try {
      const result = await submitMarks(teamId, roundId, marks);
      // Notify observers of marks update
      dataStore.updateMarks(teamId, roundId, marks);
      return result;
    } catch (error) {
      console.error('Error submitting marks:', error);
      throw error;
    }
  }

  // Load marks for a team and notify observers
  static async loadTeamMarks(teamId, roundId) {
    try {
      const marks = await fetchTeamMarks(teamId, roundId);
      // Notify observers of marks update
      if (marks.has_marks) {
        dataStore.updateMarks(teamId, roundId, marks.marks);
      }
      return marks;
    } catch (error) {
      console.error('Error loading team marks:', error);
      throw error;
    }
  }

  // Load teams with marks for a round
  static async loadTeamsWithMarks(roundId) {
    try {
      const teamsWithMarks = await fetchTeamsWithMarks(roundId);
      // Notify observers of marks updates for all teams
      teamsWithMarks.forEach(team => {
        if (team.marks && Object.keys(team.marks).length > 0) {
          dataStore.updateMarks(team.span_id, roundId, team.marks);
        }
      });
      return teamsWithMarks;
    } catch (error) {
      console.error('Error loading teams with marks:', error);
      throw error;
    }
  }
}

/**
 * Combined Observer Service for initial data loading
 */
export class ObserverService {
  // Load all initial data and notify observers
  static async loadInitialData() {
    try {
      const [teams, criteria, rounds] = await Promise.all([
        TeamsObserverService.loadTeams(),
        CriteriaObserverService.loadCriteria(),
        RoundsObserverService.loadRounds()
      ]);
      
      return {
        teams,
        criteria,
        rounds
      };
    } catch (error) {
      console.error('Error loading initial data:', error);
      throw error;
    }
  }

  // Refresh all data and notify observers
  static async refreshAllData() {
    try {
      console.log('Refreshing all data...');
      await this.loadInitialData();
      console.log('All data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing all data:', error);
      throw error;
    }
  }
}
