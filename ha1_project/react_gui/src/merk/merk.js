import { useState, useEffect } from "react";
import { stuurPunte, fetchAllTeams, submitMarks, fetchTeamMarks } from "../services/merk_services";
import { fetchRounds } from "../services/beoordelaar_services";
import "./merk.css";

function Merk() {
  const [message, setMessage] = useState("");
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState(1);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [marks, setMarks] = useState({
    kriteria1: "",
    kriteria2: "",
    kriteria3: ""
  });
  const [loading, setLoading] = useState(false);
  const [existingMarks, setExistingMarks] = useState(null);

  // Load rounds on component mount
  useEffect(() => {
    const loadRounds = async () => {
      try {
        const roundsData = await fetchRounds();
        setRounds(roundsData);
      } catch (error) {
        setMessage("Fout met laai van rondtes: " + error.message);
      }
    };
    
    loadRounds();
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
    setMarks({
      kriteria1: "",
      kriteria2: "",
      kriteria3: ""
    });
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
            setMarks({
              kriteria1: marksData.marks.kriteria1 || "",
              kriteria2: marksData.marks.kriteria2 || "",
              kriteria3: marksData.marks.kriteria3 || ""
            });
          } else {
            setMarks({
              kriteria1: "",
              kriteria2: "",
              kriteria3: ""
            });
          }
        } catch (error) {
          console.error('Error loading existing marks:', error);
          setExistingMarks(null);
        }
      } else {
        setExistingMarks(null);
        setMarks({
          kriteria1: "",
          kriteria2: "",
          kriteria3: ""
        });
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

  const handleSubmitMarks = async () => {
    if (!selectedTeamId) {
      setMessage("Kies asseblief 'n span om te merk");
      return;
    }

    // Validate marks
    const kriteria1 = parseFloat(marks.kriteria1);
    const kriteria2 = parseFloat(marks.kriteria2);
    const kriteria3 = parseFloat(marks.kriteria3);

    // Check if all fields are filled
    if (marks.kriteria1 === "" || marks.kriteria2 === "" || marks.kriteria3 === "") {
      setMessage("Vul asseblief alle punte in voordat jy dit indien");
      return;
    }

    if (isNaN(kriteria1) || isNaN(kriteria2) || isNaN(kriteria3)) {
      setMessage("Alle punte moet geldige nommers wees");
      return;
    }

    if (kriteria1 < 0 || kriteria1 > 100 || kriteria2 < 0 || kriteria2 > 100 || kriteria3 < 0 || kriteria3 > 100) {
      setMessage("Punte moet tussen 0 en 100 wees");
      return;
    }

    // Check for decimal places
    if (kriteria1 % 1 !== 0 || kriteria2 % 1 !== 0 || kriteria3 % 1 !== 0) {
      setMessage("Punte moet heelgetalle wees (geen desimale punte nie)");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await submitMarks(selectedTeamId, {
        kriteria1: kriteria1,
        kriteria2: kriteria2,
        kriteria3: kriteria3
      }, selectedRoundId);
      
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
          <h3>
            <span className="step-number">1</span>
            Kies 'n rondte en span om te merk
          </h3>
          
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
                        <li>Backend Development: {existingMarks.marks.kriteria1}/100</li>
                        <li>Frontend Development: {existingMarks.marks.kriteria2}/100</li>
                        <li>Database Design: {existingMarks.marks.kriteria3}/100</li>
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
              <div className="mark-input-group">
                <label className="mark-label">
                  Backend Development (0-100):
                </label>
                <input
                  type="number"
                  name="kriteria1"
                  value={marks.kriteria1}
                  onChange={handleMarkChange}
                  min="0"
                  max="100"
                  className="mark-input"
                  placeholder="Voer punte in"
                  required
                />
              </div>
              
              <div className="mark-input-group">
                <label className="mark-label">
                  Frontend Development (0-100):
                </label>
                <input
                  type="number"
                  name="kriteria2"
                  value={marks.kriteria2}
                  onChange={handleMarkChange}
                  min="0"
                  max="100"
                  className="mark-input"
                  placeholder="Voer punte in"
                  required
                />
              </div>
              
              <div className="mark-input-group">
                <label className="mark-label">
                  Database Design (0-100):
                </label>
                <input
                  type="number"
                  name="kriteria3"
                  value={marks.kriteria3}
                  onChange={handleMarkChange}
                  min="0"
                  max="100"
                  className="mark-input"
                  placeholder="Voer punte in"
                  required
                />
              </div>
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
              <button
                onClick={handleSubmitMarks}
                disabled={loading}
                className="submit-button"
              >
                {loading ? 'Stuur...' : 'Stuur Punte'}
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
