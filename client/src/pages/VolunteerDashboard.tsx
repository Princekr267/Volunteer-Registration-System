import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import OpportunityCard, { type Opportunity } from '../components/OpportunityCard';
import { ListPlus, CalendarDays } from 'lucide-react';

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface VolunteerProfile {
  _id: string;
  phone: string;
  skills: string[];
  interests: string;
  availability: string[];
  emergencyContact: EmergencyContact;
  status: 'pending' | 'approved' | 'suspended';
}

interface Registration {
  _id: string;
  opportunity: Opportunity;
  status: 'registered' | 'attended' | 'no_show';
  loggedHours: number;
}

const AVAILABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'schedule' | 'profile' | 'browse'>('schedule');
  
  // Data State
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Profile Form State
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: '',
    phone: '',
    relation: ''
  });
  
  // Feedback States
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [actionError, setActionError] = useState('');

  // Certificate Overlay State
  const [showCertificate, setShowCertificate] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load Profile
      const prof = await api.get('/volunteers/profile');
      setProfile(prof);
      
      // Initialize form fields
      setPhone(prof.phone || '');
      setSkills(prof.skills ? prof.skills.join(', ') : '');
      setInterests(prof.interests || '');
      setAvailability(prof.availability || []);
      setEmergencyContact(prof.emergencyContact || { name: '', phone: '', relation: '' });

      // Load My Registrations
      const regs = await api.get('/opportunities/my-registrations');
      setRegistrations(regs);

      // Load Available Opportunities
      const opps = await api.get('/opportunities');
      setOpportunities(opps);
      
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      const updated = await api.put('/volunteers/profile', {
        phone,
        skills,
        interests,
        availability,
        emergencyContact
      });
      setProfile(updated);
      setProfileSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    }
  };

  const handleToggleDay = (day: string) => {
    setAvailability(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleRegisterEvent = async (oppId: string, isRegistered: boolean) => {
    setActionError('');
    try {
      if (isRegistered) {
        await api.delete(`/opportunities/${oppId}/cancel`);
      } else {
        await api.post('/opportunities/register', { opportunityId: oppId });
      }
      
      // Reload everything
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
      setTimeout(() => setActionError(''), 5000);
    }
  };

  // Calculations for Badges & Achievements
  const totalHours = (registrations || [])
    .filter(r => r.status === 'attended')
    .reduce((sum, r) => sum + r.loggedHours, 0);

  const totalEventsAttended = (registrations || []).filter(r => r.status === 'attended').length;

  const getBadgeDetails = (hours: number) => {
    if (hours >= 25) {
      return { title: 'Gold Champion Crown', desc: 'Logged 25+ service hours', icon: '👑', color: '#F59E0B' };
    } else if (hours >= 10) {
      return { title: 'Silver Helper Shield', desc: 'Logged 10+ service hours', icon: '🛡️', color: '#9CA3AF' };
    } else if (hours >= 1) {
      return { title: 'Bronze Star Member', desc: 'Logged first service hours', icon: '⭐', color: '#D97706' };
    }
    return { title: 'Initiate Badge', desc: 'Join an event to start logging hours', icon: '🌱', color: '#6B7280' };
  };

  const activeBadge = getBadgeDetails(totalHours);

  return (
    <div className="dashboard-layout">
      {/* Sidebar profile overview */}
      <div className="profile-sidebar">
        <div className="profile-card glass-panel">
          <div className="profile-avatar">
            {user?.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <h3 className="profile-name">{user?.fullName}</h3>
          <span className="profile-role-badge">Volunteer Portal</span>
          
          <div className="profile-status">
            <span className={`status-dot ${profile?.status || 'pending'}`}></span>
            <span className={`status-text ${profile?.status || 'pending'}`}>
              Status: {profile?.status || 'pending'}
            </span>
          </div>
        </div>

        <div className="achievement-panel glass-panel">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            My Contributions
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Hours Volunteered:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{totalHours} hrs</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Events Attended:</span>
            <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{totalEventsAttended}</span>
          </div>

          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Current Achievement</h4>
          <div className="badge-row">
            <span className="badge-icon">{activeBadge.icon}</span>
            <div className="badge-details">
              <h4>{activeBadge.title}</h4>
              <p>{activeBadge.desc}</p>
            </div>
          </div>

          {totalHours > 0 && (
            <button 
              onClick={() => setShowCertificate(true)} 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.6rem', fontSize: '0.9rem', justifyContent: 'center' }}
            >
              Generate Certificate
            </button>
          )}
        </div>
      </div>

      {/* Main dashboard content */}
      <div>
        <div className="dashboard-tabs">
          <button 
            className={`dashboard-tab ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            My Schedule
          </button>
          <button 
            className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Edit Profile
          </button>
          <button 
            className={`dashboard-tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Events
          </button>
        </div>

        {actionError && <div className="form-error" style={{ marginBottom: '1.5rem' }}>{actionError}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>Loading dashboard details...</div>
        ) : (
          <>
            {/* My Schedule Tab */}
            {activeTab === 'schedule' && (
              <div>
                <h3 className="section-title" style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>
                  <CalendarDays size={20} color="#6366F1" /> Registered Events
                </h3>
                {!registrations || registrations.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                    You haven't signed up for any events yet. Visit the "Browse Events" tab to join!
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Event Opportunity</th>
                          <th>Date / Location</th>
                          <th>Status</th>
                          <th>Hours Logged</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map(reg => {
                          if (!reg.opportunity) return null;
                          const formattedDate = new Date(reg.opportunity.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          });
                          return (
                            <tr key={reg._id}>
                              <td style={{ fontWeight: 600 }}>{reg.opportunity.title}</td>
                              <td>
                                <div>{formattedDate}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  {reg.opportunity.location}
                                </div>
                              </td>
                              <td>
                                <span className={`badge-status ${reg.status}`}>{reg.status}</span>
                              </td>
                              <td style={{ fontWeight: 600, color: reg.status === 'attended' ? 'var(--secondary)' : 'inherit' }}>
                                {reg.status === 'attended' ? `${reg.loggedHours} hrs` : '-'}
                              </td>
                              <td>
                                {reg.status === 'registered' ? (
                                  <button
                                    onClick={() => handleRegisterEvent(reg.opportunity._id, true)}
                                    className="logout-btn"
                                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                                  >
                                    Cancel
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Profile Form Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                  Volunteer Profile Form
                </h3>
                
                {profileSuccess && <div className="form-success">{profileSuccess}</div>}
                {profileError && <div className="form-error">{profileError}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    type="text"
                    id="phone"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="skills">Skills (separated by commas)</label>
                  <input
                    type="text"
                    id="skills"
                    className="form-input"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Event Management, First Aid, Teaching, Public Speaking"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="interests">Interests / Motivation</label>
                  <textarea
                    id="interests"
                    rows={3}
                    className="form-textarea"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="Describe why you want to volunteer and what fields interest you..."
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Availability (Days you are free)</label>
                  <div className="checkbox-group">
                    {AVAILABLE_DAYS.map(day => (
                      <label key={day} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={availability.includes(day)}
                          onChange={() => handleToggleDay(day)}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2rem', marginBottom: '1rem' }}>
                  Emergency Contact
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ec-name">Name</label>
                    <input
                      type="text"
                      id="ec-name"
                      className="form-input"
                      value={emergencyContact.name}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ec-phone">Phone Number</label>
                    <input
                      type="text"
                      id="ec-phone"
                      className="form-input"
                      value={emergencyContact.phone}
                      onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                      placeholder="+1 (555) 019-8765"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ec-relation">Relationship</label>
                  <input
                    type="text"
                    id="ec-relation"
                    className="form-input"
                    value={emergencyContact.relation}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}
                    placeholder="Spouse / Parent / Sibling"
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}>
                  Save Profile Info
                </button>
              </form>
            )}

            {/* Browse Events Tab */}
            {activeTab === 'browse' && (
              <div>
                <h3 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>
                  <ListPlus size={20} color="#6366F1" /> Available Opportunities
                </h3>
                {!opportunities || opportunities.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
                    No active opportunities available right now.
                  </div>
                ) : (
                  <div className="opportunities-grid">
                    {opportunities.map(opp => {
                      const registered = registrations.some(r => r.opportunity?._id === opp._id);
                      return (
                        <OpportunityCard
                          key={opp._id}
                          opp={opp}
                          isRegistered={registered}
                          actionDisabled={profile?.status !== 'approved'}
                          onAction={() => handleRegisterEvent(opp._id, registered)}
                          actionText={
                            profile?.status !== 'approved'
                              ? 'Approval Required to Join'
                              : registered
                              ? 'Cancel Registration'
                              : 'Register for Event'
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Printable Certificate Modal Overlay */}
      {showCertificate && (
        <div className="certificate-preview-overlay">
          <div className="certificate-frame">
            <div className="cert-seal">🎖️</div>
            <div className="cert-header">Certificate of Appreciation</div>
            <div className="cert-sub">This certificate is proudly presented to</div>
            <div className="cert-name">{user?.fullName}</div>
            <div className="cert-sub">in recognition of valuable contribution and service</div>
            
            <p className="cert-text">
              For completing a total of <span className="cert-hours">{totalHours} hours</span> of dedicated service 
              across <span className="cert-hours">{totalEventsAttended} events</span>. Your altruism, teamwork, 
              and leadership have greatly benefited the community.
            </p>

            <div className="cert-footer">
              <div className="cert-sig-box">
                <div style={{ fontStyle: 'italic', color: '#1F2937', marginBottom: '0.25rem', fontFamily: 'Georgia, serif' }}>ServeUnity Management</div>
                <div>Authorized Signature</div>
              </div>
              <div className="cert-seal" style={{ fontSize: '2.5rem', color: '#D97706' }}>
                💮
              </div>
              <div className="cert-sig-box">
                <div style={{ color: '#1F2937', marginBottom: '0.25rem' }}>{new Date().toLocaleDateString()}</div>
                <div>Date of Issue</div>
              </div>
            </div>
          </div>

          <div className="certificate-actions">
            <button onClick={() => window.print()} className="btn-primary">
              Print Certificate / PDF
            </button>
            <button onClick={() => setShowCertificate(false)} className="btn-secondary">
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
