import React, { useState, useEffect, useCallback } from 'react';
import { fetchTeamWithMembers } from '../services/span_services';
import './span.css';

function Span({ teamId = 1 }) {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { team, members } = await fetchTeamWithMembers(teamId);
      setTeam(team);
      setMembers(members);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeamData();
  }, [teamId, fetchTeamData]);

  if (loading) {
    return (
      <div className="span-container">
        <div className="loading">Laai span inligting...</div>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="span-container">
        <div className="error">Fout: {error}</div>
      </div>
    );
  }

  return (
    <div className="span-container">
      {team && (
        <div className="team-card">
          <div className="team-header">
            {team.logo && (
              <div className="team-logo">
                <img src={team.logo} alt={`${team.naam} logo`} />
              </div>
            )}
            <div className="team-info">
              <h2 className="team-name">{team.naam}</h2>
              <p className="team-description">{team.projek_beskrywing}</p>
              <p className="team-bio">{team.span_bio}</p>
            </div>
          </div>

          <div className="members-section">
            <h3>Span Lede ({members.length})</h3>
            <div className="members-grid">
              {members.map((member) => (
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
                    <h4 className="member-name">{member.naam}</h4>
                    <p className="member-bio">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Span;
