const API_BASE_URL = 'http://localhost:4000';

/**
 * Fetch team data by team ID
 * @param {number} teamId - The ID of the team to fetch
 * @returns {Promise<Object>} Team data object
 */
export const fetchTeam = async (teamId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team data: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
};

/**
 * Fetch team members by team ID
 * @param {number} teamId - The ID of the team to fetch members for
 * @returns {Promise<Array>} Array of team member objects
 */
export const fetchTeamMembers = async (teamId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};

/**
 * Fetch a specific member by ID
 * @param {number} memberId - The ID of the member to fetch
 * @returns {Promise<Object>} Member data object
 */
export const fetchMember = async (memberId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/members/${memberId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch member: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching member:', error);
    throw error;
  }
};

/**
 * Fetch both team data and members in parallel
 * @param {number} teamId - The ID of the team to fetch
 * @returns {Promise<Object>} Object containing team and members data
 */
export const fetchTeamWithMembers = async (teamId) => {
  try {
    const [team, members] = await Promise.all([
      fetchTeam(teamId),
      fetchTeamMembers(teamId)
    ]);
    
    return { team, members };
  } catch (error) {
    console.error('Error fetching team with members:', error);
    throw error;
  }
};

/**
 * Fetch all teams
 * @returns {Promise<Array>} Array of team objects
 */
export const fetchAllTeams = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams`);
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

/**
 * Create a new team
 * @param {Object} teamData - Team data object
 * @param {string} teamData.naam - Team name
 * @param {string} teamData.projek_beskrywing - Project description
 * @param {string} teamData.span_bio - Team bio
 * @param {string} teamData.logo - Team logo URL (optional)
 * @returns {Promise<Object>} Created team object
 */
export const createTeam = async (teamData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create team: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

/**
 * Update a team
 * @param {number} teamId - Team ID to update
 * @param {Object} teamData - Updated team data
 * @returns {Promise<Object>} Updated team object
 */
export const updateTeam = async (teamId, teamData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update team: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

/**
 * Delete a team
 * @param {number} teamId - Team ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteTeam = async (teamId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete team: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

/**
 * Create a new team member
 * @param {number} teamId - Team ID
 * @param {Object} memberData - Member data object
 * @param {string} memberData.naam - Member name
 * @param {string} memberData.bio - Member bio
 * @param {string} memberData.foto - Member photo URL (optional)
 * @returns {Promise<Object>} Created member object
 */
export const createMember = async (teamId, memberData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create member: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating member:', error);
    throw error;
  }
};

/**
 * Update a team member
 * @param {number} memberId - Member ID to update
 * @param {Object} memberData - Updated member data
 * @returns {Promise<Object>} Updated member object
 */
export const updateMember = async (memberId, memberData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memberData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update member: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

/**
 * Delete a team member
 * @param {number} memberId - Member ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteMember = async (memberId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete member: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};


