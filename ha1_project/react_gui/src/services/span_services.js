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

