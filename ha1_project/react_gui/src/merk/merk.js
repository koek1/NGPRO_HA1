import { useState, useEffect } from "react";
import { stuurPunte, fetchAllTeams, submitMarks, fetchTeamMarks } from "../services/merk_services";
import { fetchRounds } from "../services/beoordelaar_services";
import { fetchAllCriteria } from "../services/criteria_services";
import "./merk.css";

function Merk() {
  const [message, setMessage] = useState("");
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState(1);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [existingMarks, setExistingMarks] = useState(null);

  // Load rounds and criteria on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [roundsData, criteriaData] = await Promise.all([
          fetchRounds(),
          fetchAllCriteria()
        ]);
        setRounds(roundsData);
        setCriteria(criteriaData);
        
        // Initialize marks object with all criteria
        const initialMarks = {};
        criteriaData.forEach(crit => {
          initialMarks[`kriteria${crit.kriteria_id}`] = "";
        });
        setMarks(initialMarks);
      } catch (error) {
        setMessage("Fout met laai van data: " + error.message);
      }
    };
    
    loadInitialData();
  }, []);

  // Load teams when round changes
  useEffect(() => {
    const loadTeamsForRound = async () => {
      try {
        if (selectedRoundId === 1) {
          // Round 1: Show all teams
          const teamsData = await fetchAllTeams();
          setTeams(teamsData);
        } else {
          // Round 2+: Only show teams that were not eliminated in the previous round
          const response = await fetch(`http://localhost:4000/rounds/${selectedRoundId - 1}/elimination`);
          if (response.ok) {
            const eliminationData = await response.json();
            setTeams(eliminationData.remaining_teams || []);
          } else {
            setMessage("Kon nie oorblywende spanne laai nie vir Rondte " + selectedRoundId);
            setTeams([]);
          }
        }
      } catch (error) {
        setMessage("Fout met laai van spanne vir Rondte " + selectedRoundId + ": " + error.message);
        setTeams([]);
      }
    };
    
    loadTeamsForRound();
    
    // Clear selected team when round changes
    setSelectedTeamId("");
    setSelectedTeam(null);
    // Clear marks for all criteria
    const clearedMarks = {};
    criteria.forEach(crit => {
      clearedMarks[`kriteria${crit.kriteria_id}`] = "";
    });
    setMarks(clearedMarks);
    setExistingMarks(null);
  }, [selectedRoundId]);

  // Load existing marks when team is selected
  useEffect(() => {
    const loadExistingMarks = async () => {
      if (selectedTeamId && selectedRoundId) {
        try {
          const marksData = await fetchTeamMarks(selectedTeamId, selectedRoundId);
          setExistingMarks(marksData);
          
          // Pre-fill form with existing marks if they exist
          if (marksData.has_marks) {
            const existingMarks = {};
            criteria.forEach(crit => {
              existingMarks[`kriteria${crit.kriteria_id}`] = marksData.marks[`kriteria${crit.kriteria_id}`] || "";
            });
            setMarks(existingMarks);
          } else {
            // Clear marks for all criteria
            const clearedMarks = {};
            criteria.forEach(crit => {
              clearedMarks[`kriteria${crit.kriteria_id}`] = "";
            });
            setMarks(clearedMarks);
          }
        } catch (error) {
          console.error('Error loading existing marks:', error);
          setExistingMarks(null);
        }
      } else {
        setExistingMarks(null);
        // Clear marks for all criteria
        const clearedMarks = {};
        criteria.forEach(crit => {
          clearedMarks[`kriteria${crit.kriteria_id}`] = "";
        });
        setMarks(clearedMarks);
      }
    };

    loadExistingMarks();
  }, [selectedTeamId, selectedRoundId]);

  // Update selected team when team ID changes
  useEffect(() => {
    if (selectedTeamId && teams.length > 0) {
      const team = teams.find(t => t.span_id === parseInt(selectedTeamId));
      setSelectedTeam(team);
    } else {
      setSelectedTeam(null);
    }
  }, [selectedTeamId, teams]);

  const handleTeamChange = (e) => {
    setSelectedTeamId(e.target.value);
    setMessage("");
  };

  const handleMarkChange = (e) => {
    const { name, value } = e.target;
    setMarks(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      setMessage("");

      // Reload criteria and rounds
      const [criteriaData, roundsData] = await Promise.all([
        fetchAllCriteria(),
        fetchRounds()
      ]);

      setCriteria(criteriaData);
      setRounds(roundsData);

      // Clear existing marks and reload teams for current round
      setMarks({});
      if (selectedRoundId) {
        const teamsData = await fetchAllTeams(selectedRoundId);
        setTeams(teamsData);

        // Initialize marks for new criteria
        const newMarks = {};
        criteriaData.forEach(crit => {
          newMarks[`kriteria${crit.kriteria_id}`] = "";
        });
        setMarks(newMarks);
      }

      setMessage("Data suksesvol herlaai");
    } catch (error) {
      setMessage("Fout met herlaai van data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to avoid IIFE issues
  const getSelectedRound = () => {
    return rounds.find(r => r.rondte_id === selectedRoundId);
  };

  const isRoundClosed = () => {
    const selectedRound = getSelectedRound();
    return selectedRound && selectedRound.is_gesluit === 1;
  };

  const getButtonText = () => {
    if (loading) return 'Stuur...';
    return isRoundClosed() ? 'Rondte Gesluit' : 'Stuur Punte';
  };

  const handleSubmitMarks = async () => {
    if (!selectedTeamId) {
      setMessage("Kies asseblief 'n span om te merk");
      return;
    }

    // Check if the selected round is closed
    const selectedRound = rounds.find(r => r.rondte_id === selectedRoundId);
    if (selectedRound && selectedRound.is_gesluit) {
      setMessage("Kan nie punte byvoeg vir 'n geslote rondte nie");
      return;
    }

    // Validate marks for all criteria
    const marksToSubmit = {};
    let hasEmptyFields = false;
    let hasInvalidNumbers = false;
    let hasInvalidRange = false;
    let hasDecimals = false;

    for (const crit of criteria) {
      const markKey = `kriteria${crit.kriteria_id}`;
      const markValue = marks[markKey];
      
      if (markValue === "") {
        hasEmptyFields = true;
        break;
      }
      
      const numericValue = parseFloat(markValue);
      if (isNaN(numericValue)) {
        hasInvalidNumbers = true;
        break;
      }
      
      if (numericValue < 0 || numericValue > crit.default_totaal) {
        hasInvalidRange = true;
        break;
      }
      
      if (numericValue % 1 !== 0) {
        hasDecimals = true;
        break;
      }
      
      marksToSubmit[markKey] = numericValue;
    }

    if (hasEmptyFields) {
      setMessage("Vul asseblief alle punte in voordat jy dit indien");
      return;
    }

    if (hasInvalidNumbers) {
      setMessage("Alle punte moet geldige nommers wees");
      return;
    }

    if (hasInvalidRange) {
      setMessage("Punte moet tussen 0 en die maksimum totaal vir elke kriteria wees");
      return;
    }

    if (hasDecimals) {
      setMessage("Punte moet heelgetalle wees (geen desimale punte nie)");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await submitMarks(selectedTeamId, marksToSubmit, selectedRoundId);
      
      setMessage("Punte suksesvol gestuur vir " + (selectedTeam?.naam || "geselekteerde span") + " in Rondte " + selectedRoundId + "!");
      
      // Reload existing marks to show updated data
      const marksData = await fetchTeamMarks(selectedTeamId);
      setExistingMarks(marksData);
      
    } catch (err) {
      setMessage("Fout met stuur van punte: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="merk-container">
      <div className="merk-header">
        <h1>Merk Bladsy</h1>
        <p>Kies 'n span en gee punte vir hul projek</p>
      </div>
      
      <div className="merk-steps">
        <div className="merk-step">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>
              <span className="step-number">1</span>
              Kies 'n rondte en span om te merk
            </h3>
            <button 
              onClick={handleRefreshData}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.9em', padding: '8px 16px' }}
            >
              {loading ? 'Herlaai...' : 'Herlaai Data'}
            </button>
          </div>
          
          <div className="round-selector" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>
              Rondte:
            </label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(parseInt(e.target.value))}
              className="team-select"
              style={{ maxWidth: '300px' }}
            >
              {rounds.map(round => (
                <option key={round.rondte_id} value={round.rondte_id}>
                  Rondte {round.rondte_id} {round.is_gesluit ? '(Gesluit)' : '(Aktief)'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="team-selector">
            <label style={{ display: 'block', marginBottom: '10px', color: '#333', fontWeight: 'bold' }}>
              Spanne vir Rondte {selectedRoundId}:
            </label>
            <select 
              value={selectedTeamId} 
              onChange={handleTeamChange}
              className="team-select"
            >
              <option value="">-- Kies 'n span --</option>
              {teams.length === 0 ? (
                <option value="" disabled>
                  {selectedRoundId === 1 ? "Laai spanne..." : "Geen spanne beskikbaar vir hierdie rondte nie"}
                </option>
              ) : (
                teams.map(team => (
                  <option key={team.span_id} value={team.span_id}>
                    {team.naam}
                  </option>
                ))
              )}
            </select>
            {selectedRoundId > 1 && teams.length > 0 && (
              <p style={{ marginTop: '10px', color: '#666', fontSize: '0.9em' }}>
                Toon slegs spanne wat nie in Rondte {selectedRoundId - 1} uitgeskakel is nie
              </p>
            )}
            
            {selectedTeam && (
              <div className="team-info-card">
                <h4>Geselekteerde span: {selectedTeam.naam}</h4>
                <p><strong>Projek:</strong> {selectedTeam.projek_beskrywing}</p>
                <p><strong>Bio:</strong> {selectedTeam.span_bio}</p>
                
                {/* Always show marks section */}
                <div className="marks-section">
                  <strong>Bestaande punte vir Rondte {selectedRoundId}:</strong>
                  {existingMarks?.has_marks ? (
                    <div className="existing-marks">
                      <ul>
                        {criteria.map(crit => (
                          <li key={crit.kriteria_id}>
                            {crit.beskrywing}: {existingMarks.marks[`kriteria${crit.kriteria_id}`] || 0}/{crit.default_totaal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="no-marks-message">
                      Hierdie span het nog nie punte ontvang nie vir hierdie rondte.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedTeamId && (
          <div className="merk-step">
            <h3>
              <span className="step-number">2</span>
              Voltooi die merkblad
            </h3>
            <div className="marks-form">
              {criteria.map(crit => (
                <div key={crit.kriteria_id} className="mark-input-group">
                  <label className="mark-label">
                    {crit.beskrywing} (0-{crit.default_totaal}):
                  </label>
                  <input
                    type="number"
                    name={`kriteria${crit.kriteria_id}`}
                    value={marks[`kriteria${crit.kriteria_id}`] || ""}
                    onChange={handleMarkChange}
                    min="0"
                    max={crit.default_totaal}
                    className="mark-input"
                    placeholder="Voer punte in"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTeamId && (
          <div className="merk-step">
            <div className="submit-section">
              <h3 style={{ color: 'white', margin: '0 0 20px 0' }}>
                <span className="step-number" style={{ background: 'white', color: '#28a745' }}>3</span>
                Dien die voltooide merkblad in
              </h3>
              {isRoundClosed() ? (
                <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                  <strong>Let op:</strong> Hierdie rondte is reeds gesluit. Jy kan nie meer punte byvoeg nie.
                </div>
              ) : null}
              <button
                onClick={handleSubmitMarks}
                disabled={loading || isRoundClosed()}
                className="submit-button"
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {message && (
        <div className={`message ${message.includes('suksesvol') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default Merk;
