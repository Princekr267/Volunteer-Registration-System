import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import OpportunityCard, { type Opportunity } from '../components/OpportunityCard';
import { Heart, CalendarDays } from 'lucide-react';

const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [myRegIds, setMyRegIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats] = useState({
    volunteers: 48,
    events: 12,
    hours: 240
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const opps = await api.get('/opportunities');
      setOpportunities(opps);

      if (user && user.role === 'volunteer') {
        const myRegs = await api.get('/opportunities/my-registrations');
        setMyRegIds(myRegs.map((r: any) => r.opportunity?._id || r.opportunity));
      }
    } catch (err: any) {
      setError('Could not load opportunities. Ensure backend and MongoDB are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAction = async (opp: Opportunity) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }

    const isRegistered = myRegIds.includes(opp._id);

    try {
      if (isRegistered) {
        await api.delete(`/opportunities/${opp._id}/cancel`);
        setMyRegIds(prev => prev.filter(id => id !== opp._id));
      } else {
        await api.post('/opportunities/register', { opportunityId: opp._id });
        setMyRegIds(prev => [...prev, opp._id]);
      }
      // Reload opportunities to get updated registration counts
      const updatedOpps = await api.get('/opportunities');
      setOpportunities(updatedOpps);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div>
      <div className="hero-section">
        <span className="hero-badge">Make an Impact Today</span>
        <h1 className="hero-title">Empower Communities through Volunteering</h1>
        <p className="hero-subtitle">
          Join ServeUnity, where passion meets purpose. Browse local service opportunities, 
          manage your scheduling, log hours, and unlock badges for your contributions.
        </p>
        <div className="hero-ctas">
          {!user ? (
            <>
              <Link to="/signup" className="btn-primary">
                Get Started <Heart size={16} />
              </Link>
              <a href="#opportunities" className="btn-secondary">
                Browse Events
              </a>
            </>
          ) : user.role === 'admin' ? (
            <Link to="/admin" className="btn-primary">
              Open Admin Dashboard
            </Link>
          ) : (
            <Link to="/dashboard" className="btn-primary">
              View My Portal
            </Link>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-val">{stats.volunteers}+</div>
          <div className="stat-lbl">Active Volunteers</div>
        </div>
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="stat-val">{stats.events}</div>
          <div className="stat-lbl">Upcoming Opportunities</div>
        </div>
        <div className="stat-card glass-panel" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div className="stat-val">{stats.hours}+</div>
          <div className="stat-lbl">Logged Service Hours</div>
        </div>
      </div>

      <div id="opportunities" style={{ marginTop: '4rem', scrollMarginTop: '100px' }}>
        <div className="section-header">
          <h2 className="section-title">
            <CalendarDays size={24} color="#6366F1" />
            Upcoming Opportunities
          </h2>
        </div>

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>
            Searching for active events...
          </div>
        ) : !opportunities || opportunities.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
            No active opportunities found. Check back later or create one as an admin!
          </div>
        ) : (
          <div className="opportunities-grid">
            {opportunities.map(opp => {
              const registered = myRegIds.includes(opp._id);
              return (
                <OpportunityCard
                  key={opp._id}
                  opp={opp}
                  isRegistered={registered}
                  onAction={() => handleAction(opp)}
                  actionText={!user ? 'Sign In to Join' : registered ? 'Leave Event' : 'Join'}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
