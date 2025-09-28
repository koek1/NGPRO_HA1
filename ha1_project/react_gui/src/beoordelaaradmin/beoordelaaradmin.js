
import React, { useState, useEffect } from "react";
import { fetchCriteria, fetchRounds, fetchTeamsWithMarks, closeRound, fetchWinner } from '../services/beoordelaar_services';
import './beoordelaaradmin.css';

function BeoordelaarAdmin() {
  const [criteria, setCriteria] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [teamsWithMarks, setTeamsWithMarks] = useState([]);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [criteriaData, roundsData] = await Promise.all([
          fetchCriteria(),
          fetchRounds()
        ]);
        setCriteria(criteriaData);
        setRounds(roundsData);
        
        // Select first round by default
        if (roundsData.length > 0) {
          setSelectedRound(roundsData[0]);
        }
      } catch (err) {
        setError('Kon nie data laai nie: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load teams with marks when round changes
  useEffect(() => {
    const loadTeamsWithMarks = async () => {
      if (selectedRound) {
        setLoading(true);
        try {
          const teamsData = await fetchTeamsWithMarks(selectedRound.rondte_id);
          setTeamsWithMarks(teamsData);
        } catch (err) {
          setError('Kon nie span punte laai nie: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTeamsWithMarks();
  }, [selectedRound]);


  const handleRoundSelect = (roundId) => {
    const round = rounds.find(r => r.rondte_id === roundId);
    setSelectedRound(round);
    setWinner(null); // Clear winner when selecting new round
  };

  const handleCloseRound = async () => {
    if (!selectedRound) return;
    
    // Different confirmation message based on round type
    const confirmMsg = selectedRound.is_laaste 
      ? 'Is jy seker jy wil hierdie finale rondte sluit? Die wenner sal bepaal word.'
      : 'Is jy seker jy wil hierdie rondte sluit? Die onderste 50% van spanne sal uitgeskakel word.';
    
    if (window.confirm(confirmMsg)) {
      setLoading(true);
      try {
        const result = await closeRound(selectedRound.rondte_id);
        setWinner(result.winner);
        
        let eliminationMsg;
        if (result.is_final_round && result.overall_winner) {
          eliminationMsg = `🏆 FINALE RONDTE GESLUIT! 🏆\n\nAlgehele wenner: ${result.overall_winner.naam}\nGemiddeld punt: ${Math.round(result.overall_winner.gemiddeld_punt || 0)}/100\n\nProficiat aan die wenner span!`;
        } else if (result.elimination_summary) {
          eliminationMsg = `Rondte gesluit! ${result.elimination_summary.eliminated_count} spanne uitgeskakel, ${result.elimination_summary.remaining_count} spanne gaan voort.`;
        } else {
          eliminationMsg = 'Rondte suksesvol gesluit!';
        }
        alert(eliminationMsg);
        
        // Refresh rounds to update status
        const updatedRounds = await fetchRounds();
        setRounds(updatedRounds);
      } catch (err) {
        setError('Kon nie rondte sluit nie: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShowWinner = async () => {
    if (!selectedRound) return;
    
    setLoading(true);
    try {
      const winnerData = await fetchWinner(selectedRound.rondte_id);
      setWinner(winnerData);
    } catch (err) {
      setError('Kon nie wenner laai nie: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const getCriteriaName = (criteriaId) => {
    const crit = criteria.find(c => c.kriteria_id === criteriaId);
    return crit ? crit.beskrywing : `Kriteria ${criteriaId}`;
  };

  const calculateAverageMark = (marks) => {
    const markValues = Object.values(marks).filter(mark => mark > 0);
    if (markValues.length === 0) return 0;
    return Math.round(markValues.reduce((sum, mark) => sum + mark, 0) / markValues.length);
  };

  if (loading && !teamsWithMarks.length) {
    return (
      <div className="beoordelaar-admin-container">
        <div className="loading">Laai data...</div>
      </div>
    );
  }

  return (
    <div className="beoordelaar-admin-container">
      <div className="admin-header">
        <h1>Welkom by die Beoordelaar Admin bladsy</h1>
      </div>

      {error && (
        <div className="error-message">
          <strong>Fout:</strong> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="admin-content">
        {/* Round Selection */}
        <div className="round-selection">
          <h3>Kies Kriterea</h3>
          <select 
            value={selectedRound?.rondte_id || ''} 
            onChange={(e) => handleRoundSelect(parseInt(e.target.value))}
            className="round-select"
          >
            <option value="">Kies 'n rondte...</option>
            {rounds.map(round => (
              <option key={round.rondte_id} value={round.rondte_id}>
                Rondte {round.rondte_id} {round.is_gesluit ? '(Gesluit)' : '(Aktief)'}
              </option>
            ))}
          </select>
        </div>


        {/* Teams with Marks Display */}
        {selectedRound && (
          <div className="teams-marks-section">
            <h3>Span Punte vir Rondte {selectedRound.rondte_id}</h3>
            {selectedRound.rondte_id > 1 && (
              <div className="round-info-banner">
                <p><strong>⚠️ Let op:</strong> Hierdie rondte toon slegs spanne wat nie in die vorige rondte uitgeskakel is nie.</p>
              </div>
            )}
            <div className="teams-grid">
              {teamsWithMarks.map(team => (
                <div key={team.span_id} className="team-marks-card">
                  <div className="team-header">
                    {team.logo && (
                      <img src={team.logo} alt={`${team.naam} logo`} className="team-logo" />
                    )}
                    <div className="team-info">
                      <h4>{team.naam}</h4>
                      <p>{team.projek_beskrywing}</p>
                    </div>
                  </div>
                  
                  <div className="marks-display">
                    {Object.entries(team.marks).map(([criteriaId, mark]) => (
                      <div key={criteriaId} className="mark-item">
                        <span className="criteria-name">{getCriteriaName(parseInt(criteriaId))}:</span>
                        <span className="mark-value">{mark}/100</span>
                      </div>
                    ))}
                    <div className="average-mark">
                      <strong>Gemiddeld: {calculateAverageMark(team.marks)}/100</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Round Management */}
        {!selectedRound && (
          <div className="round-management">
            <h3>Rondte Bestuur</h3>
            <div className="no-round-selected">
              <p><strong>Geen rondte gekies nie!</strong> Kies eers 'n rondte van die dropdown hierbo.</p>
            </div>
          </div>
        )}
        
        {selectedRound && (
          <div className="round-management">
            <h3>Rondte Bestuur</h3>
            <div className="round-info">
              <p><strong>Selected Round:</strong> {selectedRound.rondte_id}</p>
              <p><strong>Is Closed:</strong> {selectedRound.is_gesluit ? 'Yes' : 'No'}</p>
              <p><strong>Is Final Round:</strong> {selectedRound.is_laaste ? 'Yes' : 'No'}</p>
            </div>
            <div className="round-actions">
              {!selectedRound.is_gesluit ? (
                <button 
                  onClick={handleCloseRound}
                  className="btn btn-danger"
                  disabled={loading}
                >
                  {selectedRound.is_laaste ? 'Sluit Rondte' : 'Sluit Rondte (Elimineer Onderste 50%)'}
                </button>
              ) : (
                <div className="round-closed">
                  <p>Rondte is reeds gesluit</p>
                  <div className="closed-round-actions">
                    <button 
                      onClick={handleShowWinner}
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      Vertoon Wenner
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Winner Display */}
        {winner && (
          <div className="winner-section">
            <h3>🏆 Wenner Span</h3>
            {selectedRound?.is_laaste && (
              <div className="overall-winner-banner">
                <p><strong>Proficiat! Hierdie span het die hele toernooi gewen!</strong></p>
                {selectedRound?.rondte_id === 2 && (
                  <p><strong>Rondte 2 Wenner uit 5 spanne!</strong></p>
                )}
              </div>
            )}
            <div className="winner-card">
              <div className="winner-header">
                {winner.logo && (
                  <img src={winner.logo} alt={`${winner.naam} logo`} className="winner-logo" />
                )}
                <div className="winner-info">
                  <h2>{winner.naam}</h2>
                  <p>{winner.projek_beskrywing}</p>
                  <p className="winner-bio">{winner.span_bio}</p>
                  <div className="winner-score">
                    <strong>Gemiddeld Punt: {Math.round(winner.gemiddeld_punt || 0)}/100</strong>
                  </div>
                </div>
              </div>
              
              {/* Team Members */}
              {winner.members && winner.members.length > 0 && (
                <div className="winner-members">
                  <h4>Span Lede ({winner.members.length})</h4>
                  <div className="members-grid">
                    {winner.members.map((member) => (
                      <div key={member.lid_id} className="member-card">
                        <div className="member-avatar">
                          {member.foto ? (
                            <img src={member.foto} alt={member.naam} />
                          ) : (
                            <div className="default-avatar">
                              {member.naam.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="member-info">
                          <h5 className="member-name">{member.naam}</h5>
                          <p className="member-bio">{member.bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default BeoordelaarAdmin;
