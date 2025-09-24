import React, { useState, useEffect } from 'react';
import { fetchTeamMarks } from '../services/span_services';
import './span.css';

function Span({ team, members, loading, error }) {
  const [marks, setMarks] = useState(null);

  // Load marks when team changes
  useEffect(() => {
    const loadMarks = async () => {
      if (team && team.span_id) {
        try {
          const marksData = await fetchTeamMarks(team.span_id);
          setMarks(marksData);
        } catch (error) {
          console.error('Error loading marks:', error);
          setMarks(null);
        }
      } else {
        setMarks(null);
      }
    };

    loadMarks();
  }, [team]);
  if (loading) {
    return (
      <div className="span-container">
        <div className="loading">Laai span inligting...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="span-container">
        <div className="error">Fout: {error}</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="span-container">
        <div className="no-team">Geen span geselekteer nie</div>
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

          {marks && marks.has_marks && (
            <div className="marks-section">
              <h3>Span Punte</h3>
              <div className="marks-display">
                <div className="marks-grid">
                  <div className="mark-item">
                    <span className="mark-label">Backend Development:</span>
                    <span className="mark-value">{marks.marks.kriteria1}/100</span>
                  </div>
                  <div className="mark-item">
                    <span className="mark-label">Frontend Development:</span>
                    <span className="mark-value">{marks.marks.kriteria2}/100</span>
                  </div>
                  <div className="mark-item">
                    <span className="mark-label">Database Design:</span>
                    <span className="mark-value">{marks.marks.kriteria3}/100</span>
                  </div>
                </div>
                <div className="total-marks">
                  <strong>Totaal: {Math.round((marks.marks.kriteria1 + marks.marks.kriteria2 + marks.marks.kriteria3) / 3)}/100</strong>
                </div>
              </div>
            </div>
          )}

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
