
import React, { useState, useEffect } from 'react';
import Span from './span';
import CreateTeamForm from './CreateTeamForm';
import EditTeamForm from './EditTeamForm';
import TeamList from './TeamList';
import { deleteTeam, fetchTeam, fetchTeamMembers, fetchAllTeams } from '../services/span_services';
import './spanadmin.css';

function SpanAdmin() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Load teams on component mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await fetchAllTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading teams:', error);
      }
    };
    
    loadTeams();
  }, []);

  // Auto-select first team when teams are loaded
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].span_id);
    }
  }, [teams, selectedTeamId]);

  // Load team data when selectedTeamId changes
  useEffect(() => {
    const loadTeamData = async () => {
      if (selectedTeamId && selectedTeamId > 0) {
        setLoadingTeam(true);
        // Clear members immediately when loading new team
        setSelectedMembers([]);
        try {
          const [team, members] = await Promise.all([
            fetchTeam(selectedTeamId),
            fetchTeamMembers(selectedTeamId)
          ]);
          setSelectedTeam(team);
          setSelectedMembers(members);
        } catch (error) {
          console.error('Error loading team data:', error);
          setSelectedTeam(null);
          setSelectedMembers([]);
        } finally {
          setLoadingTeam(false);
        }
      } else {
        setSelectedTeam(null);
        setSelectedMembers([]);
        setLoadingTeam(false);
      }
    };

    loadTeamData();
  }, [selectedTeamId]);

  const handleCreateTeam = (newTeam) => {
    setTeams(prev => [...prev, newTeam]);
    // Clear current team data before selecting new team
    setSelectedTeam(null);
    setSelectedMembers([]);
    setSelectedTeamId(newTeam.span_id);
    setShowCreateForm(false);
  };

  const handleRefreshTeams = async () => {
    try {
      const teamsData = await fetchAllTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error refreshing teams:', error);
    }
  };

  const handleTeamSelect = (teamId) => {
    setSelectedTeamId(teamId);
    setShowEditForm(false);
    setShowCreateForm(false);
    // Reset team data to force reload
    setSelectedTeam(null);
    setSelectedMembers([]);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleEditTeam = () => {
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
  };

  const handleTeamUpdated = async (updatedTeam) => {
    // Update teams list
    setTeams(prev => 
      prev.map(team => 
        team.span_id === updatedTeam.span_id ? updatedTeam : team
      )
    );
    
    // Update selected team data
    setSelectedTeam(updatedTeam);
    
    // Refresh members data
    try {
      const members = await fetchTeamMembers(updatedTeam.span_id);
      setSelectedMembers(members);
    } catch (error) {
      console.error('Error refreshing members:', error);
    }
    
    setShowEditForm(false);
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Is jy seker jy wil hierdie span verwyder?')) {
      try {
        await deleteTeam(teamId);
        
        // Update teams list immediately
        const updatedTeams = teams.filter(team => team.span_id !== teamId);
        setTeams(updatedTeams);
        
        // If the deleted team was selected, select another team
        if (selectedTeamId === teamId) {
          if (updatedTeams.length > 0) {
            setSelectedTeamId(updatedTeams[0].span_id);
          } else {
            setSelectedTeamId(null);
            setSelectedTeam(null);
            setSelectedMembers([]);
          }
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Kon nie span verwyder nie: ' + error.message);
      }
    }
  };

  return (
    <div className="span-admin-container">
      <div className="span-admin-header">
        <h1>Span Admin</h1>
        <div className="admin-actions">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            + Skep Nuwe Span
          </button>
          {selectedTeamId && (
            <>
              <button
                onClick={handleEditTeam}
                className="btn btn-secondary"
                disabled={!selectedTeam}
              >
                Wysig Span
              </button>
              <button
                onClick={() => handleDeleteTeam(selectedTeamId)}
                className="btn btn-danger"
                disabled={!selectedTeam}
              >
                Verwyder Span
              </button>
            </>
          )}
        </div>
      </div>

      <div className="span-admin-content">
        <div className="admin-sidebar">
          <TeamList
            teams={teams}
            onTeamSelect={handleTeamSelect}
            selectedTeamId={selectedTeamId}
            onRefresh={handleRefreshTeams}
          />
        </div>

        <div className="admin-main">
          {showCreateForm ? (
            <CreateTeamForm
              onTeamCreated={handleCreateTeam}
              onCancel={handleCancelCreate}
            />
          ) : showEditForm ? (
            <EditTeamForm
              team={selectedTeam}
              members={selectedMembers}
              onTeamUpdated={handleTeamUpdated}
              onCancel={handleCancelEdit}
            />
          ) : loadingTeam ? (
            <div className="team-display">
              <div className="loading">Laai span inligting...</div>
            </div>
          ) : selectedTeamId ? (
            <div className="team-display">
              <Span 
                team={selectedTeam} 
                members={selectedMembers} 
                loading={loadingTeam}
                error={null}
              />
            </div>
          ) : (
            <div className="team-display">
              <div className="no-team-selected">
                <h3>Geen span geselekteer nie</h3>
                <p>Klik op 'n span in die sidebar om dit te vertoon, of skep 'n nuwe span.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpanAdmin;
