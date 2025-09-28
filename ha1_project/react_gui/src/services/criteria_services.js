const API_BASE_URL = 'http://localhost:4000';

/**
 * Fetch all criteria
 * @returns {Promise<Array>} Array of criteria objects
 */
export const fetchAllCriteria = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/criteria`);
    if (!response.ok) {
      throw new Error(`Failed to fetch criteria: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching criteria:', error);
    throw error;
  }
};

/**
 * Fetch a specific criteria by ID
 * @param {number} criteriaId - Criteria ID to fetch
 * @returns {Promise<Object>} Criteria object
 */
export const fetchCriteriaById = async (criteriaId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/criteria/${criteriaId}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Kriteria nie gevind nie');
      }
      throw new Error(`Failed to fetch criteria: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching criteria:', error);
    throw error;
  }
};

/**
 * Create a new criteria
 * @param {Object} criteriaData - Criteria data with beskrywing and default_totaal
 * @returns {Promise<Object>} Created criteria object
 */
export const createCriteria = async (criteriaData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criteriaData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create criteria: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating criteria:', error);
    throw error;
  }
};

/**
 * Update an existing criteria
 * @param {number} criteriaId - Criteria ID to update
 * @param {Object} criteriaData - Updated criteria data
 * @returns {Promise<Object>} Updated criteria object
 */
export const updateCriteria = async (criteriaId, criteriaData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/criteria/${criteriaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criteriaData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update criteria: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating criteria:', error);
    throw error;
  }
};

/**
 * Delete a criteria
 * @param {number} criteriaId - Criteria ID to delete
 * @returns {Promise<Object>} Response from server
 */
export const deleteCriteria = async (criteriaId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/criteria/${criteriaId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete criteria: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting criteria:', error);
    throw error;
  }
};
