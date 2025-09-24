import React, { useState } from 'react';
import { fetchAllTeams } from '../services/span_services';
import './TeamList.css';

function TeamList({ teams, onTeamSelect, selectedTeamId, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRefresh = async () => {
    if (onRefresh) {
      setLoading(true);
      try {
        await onRefresh();
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="team-list-container">
        <div className="loading">Laai spanne...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-list-container">
        <div className="error">Fout: {error}</div>
        <button onClick={handleRefresh} className="btn btn-primary">
          Probeer Weer
        </button>
      </div>
    );
  }

  return (
    <div className="team-list-container">
      <div className="team-list-header">
        <h3>Alle Spanne ({teams ? teams.length : 0})</h3>
        <button onClick={handleRefresh} className="btn btn-secondary btn-sm">
          Herlaai
        </button>
      </div>
      
      <div className="team-list">
        {!teams || teams.length === 0 ? (
          <div className="no-teams">
            Geen spanne gevind nie. Skep 'n nuwe span om te begin.
          </div>
        ) : (
          teams.map((team) => (
            <div
              key={team.span_id}
              className={`team-item ${selectedTeamId === team.span_id ? 'selected' : ''}`}
              onClick={() => onTeamSelect(team.span_id)}
            >
              <div className="team-item-content">
                {team.logo && (
                  <div className="team-item-logo">
                    <img src={team.logo} alt={`${team.naam} logo`} />
                  </div>
                )}
                <div className="team-item-info">
                  <h4 className="team-item-name">{team.naam}</h4>
                  <p className="team-item-description">{team.projek_beskrywing}</p>
                  <p className="team-item-bio">{team.span_bio}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TeamList;
