import React, { useState, useEffect } from 'react';
import { updateTeam, createMember, updateMember, deleteMember } from '../services/span_services';
import './EditTeamForm.css';

function EditTeamForm({ team, members, onTeamUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    naam: '',
    projek_beskrywing: '',
    span_bio: '',
    logo: ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    naam: '',
    bio: '',
    foto: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (team) {
      setFormData({
        naam: team.naam || '',
        projek_beskrywing: team.projek_beskrywing || '',
        span_bio: team.span_bio || '',
        logo: team.logo || ''
      });
    }
    if (members) {
      setTeamMembers(members);
    }
  }, [team, members]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberPhotoChange = (e) => {
    const { value } = e.target;
    setNewMember(prev => ({
      ...prev,
      foto: value
    }));
  };

  const handleLogoChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      logo: value
    }));
  };

  const addMember = async () => {
    if (newMember.naam.trim() && newMember.bio.trim()) {
      try {
        const memberData = {
          naam: newMember.naam.trim(),
          bio: newMember.bio.trim(),
          foto: newMember.foto.trim() || null
        };
        
        const newMemberData = await createMember(team.span_id, memberData);
        setTeamMembers(prev => [...prev, newMemberData]);
        setNewMember({ naam: '', bio: '', foto: '' });
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const updateMemberData = async (memberId, updatedData) => {
    try {
      const updatedMember = await updateMember(memberId, updatedData);
      setTeamMembers(prev => 
        prev.map(member => 
          member.lid_id === memberId ? updatedMember : member
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (memberId) => {
    try {
      await deleteMember(memberId);
      setTeamMembers(prev => prev.filter(member => member.lid_id !== memberId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const teamData = {
        naam: formData.naam.trim(),
        projek_beskrywing: formData.projek_beskrywing.trim(),
        span_bio: formData.span_bio.trim(),
        logo: formData.logo.trim() || null
      };
      
      const updatedTeam = await updateTeam(team.span_id, teamData);
      onTeamUpdated(updatedTeam);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!team) {
    return <div>Geen span geselekteer nie</div>;
  }

  return (
    <div className="edit-team-form-container">
      <div className="edit-team-form">
        <h2>Wysig Span: {team.naam}</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="naam">Span Naam *</label>
            <input
              type="text"
              id="naam"
              name="naam"
              value={formData.naam}
              onChange={handleInputChange}
              required
              placeholder="Voer span naam in"
            />
          </div>

          <div className="form-group">
            <label htmlFor="projek_beskrywing">Projek Beskrywing *</label>
            <textarea
              id="projek_beskrywing"
              name="projek_beskrywing"
              value={formData.projek_beskrywing}
              onChange={handleInputChange}
              required
              placeholder="Beskryf die projek wat die span gaan werk aan"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="span_bio">Span Bio *</label>
            <textarea
              id="span_bio"
              name="span_bio"
              value={formData.span_bio}
              onChange={handleInputChange}
              required
              placeholder="Beskryf die span en hul vaardighede"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="logo">Logo URL (opsioneel)</label>
            <input
              type="url"
              id="logo"
              name="logo"
              value={formData.logo}
              onChange={handleLogoChange}
              placeholder="https://example.com/logo.jpg"
            />
            {formData.logo && (
              <div className="logo-preview">
                <img src={formData.logo} alt="Logo preview" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
          </div>

          <div className="members-section">
            <h3>Span Lede ({teamMembers.length})</h3>
            
            <div className="add-member-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="member-naam">Lid Naam</label>
                  <input
                    type="text"
                    id="member-naam"
                    name="naam"
                    value={newMember.naam}
                    onChange={handleMemberInputChange}
                    placeholder="Voer lid naam in"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="member-bio">Lid Bio</label>
                  <input
                    type="text"
                    id="member-bio"
                    name="bio"
                    value={newMember.bio}
                    onChange={handleMemberInputChange}
                    placeholder="Beskryf die lid"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="member-foto">Foto URL (opsioneel)</label>
                  <input
                    type="url"
                    id="member-foto"
                    name="foto"
                    value={newMember.foto}
                    onChange={handleMemberPhotoChange}
                    placeholder="https://example.com/photo.jpg"
                  />
                  {newMember.foto && (
                    <div className="photo-preview">
                      <img src={newMember.foto} alt="Photo preview" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="add-member-section">
                <button
                  type="button"
                  onClick={addMember}
                  className="btn btn-primary"
                >
                  + Voeg Lid By
                </button>
              </div>
            </div>

            <div className="members-list">
              {teamMembers.map((member) => (
                <div key={member.lid_id} className="member-item">
                  <div className="member-info">
                    <strong>{member.naam}</strong>
                    <span>{member.bio}</span>
                    {member.foto && (
                      <div className="member-photo">
                        <img src={member.foto} alt={member.naam} onError={(e) => e.target.style.display = 'none'} />
                      </div>
                    )}
                  </div>
                  <div className="member-actions">
                    <button
                      type="button"
                      onClick={() => removeMember(member.lid_id)}
                      className="btn btn-danger btn-sm"
                    >
                      Verwyder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={loading}
            >
              Kanselleer
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Stoor...' : 'Stoor Veranderinge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTeamForm;
