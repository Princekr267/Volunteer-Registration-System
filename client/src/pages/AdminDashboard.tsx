import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import SvgChart, { type ChartData } from '../components/SvgChart';
import Modal from '../components/Modal';
import OpportunityCard, { type Opportunity } from '../components/OpportunityCard';
import { 
  Users, Calendar, Clock, BarChart3, Download, Plus, CheckCircle 
} from 'lucide-react';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface VolunteerProfile {
  _id: string;
  user: User;
  phone: string;
  skills: string[];
  status: 'pending' | 'approved' | 'suspended';
}

interface Registration {
  _id: string;
  opportunity: Opportunity | string;
  volunteer: {
    _id: string;
    fullName: string;
    email: string;
  };
  status: 'registered' | 'attended' | 'no_show';
  loggedHours: number;
}

const AdminDashboard: React.FC = () => {
  // Data States
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'volunteers' | 'opportunities'>('volunteers');

  // Modal States
  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [activeOppForRegs, setActiveOppForRegs] = useState<Opportunity | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Event Creation Form State
  const [oppTitle, setOppTitle] = useState('');
  const [oppDesc, setOppDesc] = useState('');
  const [oppDate, setOppDate] = useState('');
  const [oppTime, setOppTime] = useState('');
  const [oppLocation, setOppLocation] = useState('');
  const [oppSkills, setOppSkills] = useState('');
  const [oppMaxCapacity, setOppMaxCapacity] = useState('10');
  const [oppStatus, setOppStatus] = useState<'active' | 'completed' | 'cancelled'>('active');

  // Logs Input State for Hours Verification
  const [logHoursMap, setLogHoursMap] = useState<Record<string, string>>({});

  // Feedback State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load Volunteers
      const vols = await api.get('/volunteers');
      setVolunteers(vols);

      // Load Opportunities
      const opps = await api.get('/opportunities');
      setOpportunities(opps);

    } catch (err: any) {
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // CSV Exports
  const handleExportVolunteers = async () => {
    try {
      const blob = await api.get('/reports/volunteers');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volunteers_report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not export volunteers CSV');
    }
  };

  const handleExportParticipation = async () => {
    try {
      const blob = await api.get('/reports/participation');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'event_participation_report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not export participation CSV');
    }
  };

  // Volunteer approvals
  const handleUpdateVolunteerStatus = async (id: string, status: 'approved' | 'suspended' | 'pending') => {
    try {
      await api.put(`/volunteers/${id}/status`, { status });
      setVolunteers(prev => 
        prev.map(v => v._id === id ? { ...v, status } : v)
      );
      setSuccess('Volunteer status updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Opportunity create/edit actions
  const openCreateOppModal = () => {
    setEditingOpp(null);
    setOppTitle('');
    setOppDesc('');
    setOppDate('');
    setOppTime('');
    setOppLocation('');
    setOppSkills('');
    setOppMaxCapacity('10');
    setOppStatus('active');
    setIsOppModalOpen(true);
  };

  const openEditOppModal = (opp: Opportunity) => {
    setEditingOpp(opp);
    setOppTitle(opp.title);
    setOppDesc(opp.description);
    // Format date string to YYYY-MM-DD for date input
    const formattedDate = new Date(opp.date).toISOString().split('T')[0];
    setOppDate(formattedDate);
    setOppTime(opp.time);
    setOppLocation(opp.location);
    setOppSkills(opp.skillsRequired.join(', '));
    setOppMaxCapacity(opp.maxVolunteers.toString());
    setOppStatus(opp.status);
    setIsOppModalOpen(true);
  };

  const handleOppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const body = {
      title: oppTitle,
      description: oppDesc,
      date: oppDate,
      time: oppTime,
      location: oppLocation,
      skillsRequired: oppSkills,
      maxVolunteers: parseInt(oppMaxCapacity),
      status: oppStatus
    };

    try {
      if (editingOpp) {
        await api.put(`/opportunities/${editingOpp._id}`, body);
        setSuccess('Opportunity updated successfully.');
      } else {
        await api.post('/opportunities', body);
        setSuccess('New Opportunity created successfully.');
      }
      setIsOppModalOpen(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Submit failed');
    }
  };

  const handleDeleteOpp = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this opportunity? This will also remove all registries.')) return;
    try {
      await api.delete(`/opportunities/${id}`);
      setSuccess('Opportunity deleted.');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  // View registrants
  const handleOpenRegistrants = async (opp: Opportunity) => {
    setActiveOppForRegs(opp);
    try {
      const regs = await api.get(`/opportunities/${opp._id}/registrations`);
      setRegistrations(regs);
      
      // Initialize logging inputs map
      const initialHoursMap: Record<string, string> = {};
      regs.forEach((r: Registration) => {
        initialHoursMap[r._id] = r.loggedHours.toString();
      });
      setLogHoursMap(initialHoursMap);
      setIsRegModalOpen(true);
    } catch (err) {
      alert('Failed to load event registrations.');
    }
  };

  const handleUpdateRegStatus = async (regId: string, status: 'registered' | 'attended' | 'no_show') => {
    const hours = parseFloat(logHoursMap[regId] || '0');
    try {
      const updated = await api.put(`/opportunities/registrations/${regId}`, {
        status,
        loggedHours: hours
      });
      setRegistrations(prev => 
        prev.map(r => r._id === regId ? { ...r, status: updated.status, loggedHours: updated.loggedHours } : r)
      );
      // Reload overall data counts in background
      const updatedOpps = await api.get('/opportunities');
      setOpportunities(updatedOpps);
    } catch (err: any) {
      alert(err.message || 'Verification update failed');
    }
  };

  const handleHoursChange = (regId: string, val: string) => {
    setLogHoursMap(prev => ({ ...prev, [regId]: val }));
  };

  // Metrics Calculations
  const totalVolunteers = volunteers.length;
  const pendingApprovals = volunteers.filter(v => v.status === 'pending').length;
  const activeOpps = opportunities.filter(o => o.status === 'active').length;

  // Render SVG Chart Data (Registered volunteers per active event)
  const chartData: ChartData[] = opportunities
    .filter(o => o.status === 'active')
    .map(o => ({
      label: o.title,
      value: o.registeredCount || 0
    }));

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">
          <BarChart3 size={24} color="#6366F1" />
          Admin Dashboard
        </h2>
        {success && <div className="form-success">{success}</div>}
      </div>

      {/* Metrics Card Grid */}
      <div className="admin-metrics">
        <div className="admin-metric-card glass-panel">
          <div className="metric-icon">
            <Users size={20} />
          </div>
          <div className="metric-details">
            <h4>Total Volunteers</h4>
            <div className="metric-val">{totalVolunteers}</div>
          </div>
        </div>

        <div className="admin-metric-card glass-panel">
          <div className="metric-icon">
            <Calendar size={20} />
          </div>
          <div className="metric-details">
            <h4>Active Events</h4>
            <div className="metric-val">{activeOpps}</div>
          </div>
        </div>

        <div className="admin-metric-card glass-panel">
          <div className="metric-icon">
            <Clock size={20} />
          </div>
          <div className="metric-details">
            <h4>Pending Profiles</h4>
            <div className="metric-val">{pendingApprovals}</div>
          </div>
        </div>
      </div>

      {/* Graphical Chart and Report Downloads */}
      <div className="admin-visuals">
        {/* SVG Chart Panel */}
        <SvgChart 
          data={chartData} 
          title="Volunteer Signups per Active Event" 
          yLabel="Volunteers" 
        />

        {/* Reports Download Panel */}
        <div className="glass-panel report-panel">
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Management Reports</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Export core CSV logs of the platform</p>
          </div>

          <div className="report-list">
            <div className="report-item">
              <div className="report-title">
                <h4>Volunteer Directory</h4>
                <p>Export skills, phone numbers, and profile details</p>
              </div>
              <button onClick={handleExportVolunteers} className="btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                <Download size={14} /> CSV
              </button>
            </div>

            <div className="report-item">
              <div className="report-title">
                <h4>Service & Attendance Log</h4>
                <p>Export logged hours, attendance, and events</p>
              </div>
              <button onClick={handleExportParticipation} className="btn-primary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                <Download size={14} /> CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'volunteers' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteers')}
        >
          Manage Volunteers
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'opportunities' ? 'active' : ''}`}
          onClick={() => setActiveTab('opportunities')}
        >
          Manage Opportunities
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>Loading directory details...</div>
      ) : (
        <>
          {/* Manage Volunteers Directory Table */}
          {activeTab === 'volunteers' && (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Volunteer Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Approval Action</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map(vol => {
                    if (!vol.user) return null;
                    return (
                      <tr key={vol._id}>
                        <td style={{ fontWeight: 600 }}>{vol.user.fullName}</td>
                        <td>{vol.user.email}</td>
                        <td>{vol.phone || 'N/A'}</td>
                        <td>
                          <span className={`badge-user-status ${vol.status}`}>{vol.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {vol.status !== 'approved' && (
                              <button 
                                onClick={() => handleUpdateVolunteerStatus(vol._id, 'approved')}
                                className="btn-primary" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.2rem' }}
                              >
                                <CheckCircle size={12} /> Approve
                              </button>
                            )}
                            {vol.status !== 'suspended' && (
                              <button 
                                onClick={() => handleUpdateVolunteerStatus(vol._id, 'suspended')}
                                className="logout-btn" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Manage Opportunities Grid / Creator */}
          {activeTab === 'opportunities' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button onClick={openCreateOppModal} className="btn-primary">
                  <Plus size={16} /> Create Opportunity
                </button>
              </div>

              <div className="opportunities-grid">
                {opportunities.map(opp => (
                  <OpportunityCard
                    key={opp._id}
                    opp={opp}
                    isAdmin={true}
                    onEdit={() => openEditOppModal(opp)}
                    onDelete={() => handleDeleteOpp(opp._id)}
                    onViewVolunteers={() => handleOpenRegistrants(opp)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Opportunity Modal */}
      <Modal isOpen={isOppModalOpen} onClose={() => setIsOppModalOpen(false)} title={editingOpp ? 'Edit Opportunity' : 'Create Opportunity'}>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleOppSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Opportunity Title</label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={oppTitle}
              onChange={(e) => setOppTitle(e.target.value)}
              placeholder="Food Drive Coordinator"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="desc">Description</label>
            <textarea
              id="desc"
              rows={3}
              className="form-textarea"
              value={oppDesc}
              onChange={(e) => setOppDesc(e.target.value)}
              placeholder="Describe the volunteering duties, requirements, and information..."
              required
            ></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                className="form-input"
                value={oppDate}
                onChange={(e) => setOppDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="time">Time</label>
              <input
                type="text"
                id="time"
                className="form-input"
                value={oppTime}
                onChange={(e) => setOppTime(e.target.value)}
                placeholder="10:00 AM - 2:00 PM"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              className="form-input"
              value={oppLocation}
              onChange={(e) => setOppLocation(e.target.value)}
              placeholder="Community Food Bank, Hall B"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="skills">Skills Required (comma-separated)</label>
              <input
                type="text"
                id="skills"
                className="form-input"
                value={oppSkills}
                onChange={(e) => setOppSkills(e.target.value)}
                placeholder="First Aid, Packing, Cooking"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="capacity">Max Capacity (Volunteers)</label>
              <input
                type="number"
                id="capacity"
                className="form-input"
                value={oppMaxCapacity}
                onChange={(e) => setOppMaxCapacity(e.target.value)}
                min="0"
                required
              />
            </div>
          </div>

          {editingOpp && (
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select
                id="status"
                className="form-select"
                value={oppStatus}
                onChange={(e) => setOppStatus(e.target.value as any)}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            {editingOpp ? 'Save Changes' : 'Publish Opportunity'}
          </button>
        </form>
      </Modal>

      {/* Registrants / Logged Hours Verification Modal */}
      <Modal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title={`Registrations: ${activeOppForRegs?.title || ''}`}>
        <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto', marginTop: 0 }}>
          {registrations.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>No registrations for this event.</div>
          ) : (
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Hours Logged</th>
                  <th>Action Log</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg._id}>
                    <td>{reg.volunteer?.fullName}</td>
                    <td>{reg.volunteer?.email}</td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="form-input"
                        style={{ width: '70px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                        value={logHoursMap[reg._id] || '0'}
                        disabled={reg.status !== 'attended'}
                        onChange={(e) => handleHoursChange(reg._id, e.target.value)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {reg.status !== 'attended' && (
                          <button 
                            onClick={() => handleUpdateRegStatus(reg._id, 'attended')}
                            className="btn-primary" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          >
                            Attended
                          </button>
                        )}
                        {reg.status !== 'no_show' && (
                          <button 
                            onClick={() => handleUpdateRegStatus(reg._id, 'no_show')}
                            className="logout-btn" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                          >
                            No Show
                          </button>
                        )}
                        {reg.status === 'attended' && (
                          <button 
                            onClick={() => handleUpdateRegStatus(reg._id, 'attended')}
                            className="btn-secondary" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderColor: 'rgba(16,185,129,0.3)', color: '#10B981' }}
                          >
                            Save Hours
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
