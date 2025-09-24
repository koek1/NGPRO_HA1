import React, { useState } from 'react';
import { createTeam, createMember } from '../services/span_services';
import './CreateTeamForm.css';

function CreateTeamForm({ onTeamCreated, onCancel }) {
  const [formData, setFormData] = useState({
    naam: '',
    projek_beskrywing: '',
    span_bio: '',
    logo: ''
  });
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({
    naam: '',
    bio: '',
    foto: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const addMember = () => {
    if (newMember.naam.trim() && newMember.bio.trim()) {
      setMembers(prev => [...prev, { 
        ...newMember, 
        id: Date.now()
      }]);
      setNewMember({ naam: '', bio: '', foto: '' });
    }
  };

  const removeMember = (id) => {
    setMembers(prev => prev.filter(member => member.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create team first
      const teamData = {
        naam: formData.naam,
        projek_beskrywing: formData.projek_beskrywing,
        span_bio: formData.span_bio,
        logo: formData.logo || null
      };
      
      const newTeam = await createTeam(teamData);
      
      // Create members
      for (const member of members) {
        try {
          const memberData = {
            naam: member.naam,
            bio: member.bio,
            foto: member.foto || null
          };
          
          await createMember(newTeam.span_id, memberData);
        } catch (memberErr) {
          console.warn('Member creation failed:', memberErr);
        }
      }
      
      // Only call onTeamCreated after all members are created
      onTeamCreated(newTeam);
      
      // Reset form
      setFormData({
        naam: '',
        projek_beskrywing: '',
        span_bio: '',
        logo: ''
      });
      setMembers([]);
      setNewMember({ naam: '', bio: '', foto: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-team-form-container">
      <div className="create-team-form">
        <h2>Skep Nuwe Span</h2>
        
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
            <h3>Span Lede</h3>
            
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
                <button
                  type="button"
                  onClick={addMember}
                  className="btn btn-secondary btn-sm"
                >
                  + Voeg Lid By
                </button>
              </div>
            </div>

            {members.length > 0 && (
              <div className="members-list">
                <h4>Toegevoegde Lede ({members.length})</h4>
                {members.map((member) => (
                  <div key={member.id} className="member-item">
                    <div className="member-info">
                      <strong>{member.naam}</strong>
                      <span>{member.bio}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Verwyder
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              {loading ? 'Skep...' : 'Skep Span'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTeamForm;
