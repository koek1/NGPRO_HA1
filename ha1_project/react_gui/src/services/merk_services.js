const API_BASE_URL = 'http://localhost:4000';

export async function stuurPunte(punteData) {
  const response = await fetch(`${API_BASE_URL}/merk/punte`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(punteData)
  });

  if (!response.ok) {
    throw new Error("Kon nie punte stuur nie");
  }

  return await response.json();
}

/**
 * Fetch all teams for selection
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
 * Submit marks for a specific team
 * @param {number} teamId - Team ID to submit marks for
 * @param {Object} marks - Marks object with kriteria1, kriteria2, kriteria3
 * @param {number} roundId - Round ID to submit marks for (defaults to 1)
 * @returns {Promise<Object>} Response from server
 */
export const submitMarks = async (teamId, marks, roundId = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/marks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...marks,
        rondteId: roundId
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to submit marks: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting marks:', error);
    throw error;
  }
};

/**
 * Fetch marks for a specific team
 * @param {number} teamId - Team ID to fetch marks for
 * @param {number} roundId - Round ID to fetch marks for (defaults to 1)
 * @returns {Promise<Object>} Marks data for the team
 */
export const fetchTeamMarks = async (teamId, roundId = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/marks?rondteId=${roundId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch team marks: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team marks:', error);
    throw error;
  }
};

/**
 * Clear marks for a specific team
 * @param {number} teamId - Team ID to clear marks for
 * @returns {Promise<Object>} Response from server
 */
export const clearTeamMarks = async (teamId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/marks`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to clear marks: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error clearing marks:', error);
    throw error;
  }
};