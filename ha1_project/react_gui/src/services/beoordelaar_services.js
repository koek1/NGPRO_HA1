const API_BASE_URL = 'http://localhost:4000';

// Fetch all criteria
export const fetchCriteria = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/criteria`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching criteria:', error);
    throw error;
  }
};

// Fetch all rounds
export const fetchRounds = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/rounds`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching rounds:', error);
    throw error;
  }
};

// Fetch teams with marks for a specific round
export const fetchTeamsWithMarks = async (roundId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rounds/${roundId}/teams-marks`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching teams with marks:', error);
    throw error;
  }
};

// Close a round
export const closeRound = async (roundId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rounds/${roundId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error closing round:', error);
    throw error;
  }
};

// Fetch elimination results for a round
export const fetchEliminationResults = async (roundId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rounds/${roundId}/elimination`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching elimination results:', error);
    throw error;
  }
};

// Create next round with remaining teams
export const createNextRound = async (roundId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rounds/${roundId}/create-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating next round:', error);
    throw error;
  }
};

// Fetch winner for a closed round
export const fetchWinner = async (roundId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rounds/${roundId}/winner`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching winner:', error);
    throw error;
  }
};
