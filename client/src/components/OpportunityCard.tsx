import React from 'react';
import { Calendar, MapPin, Clock, Users, Edit, Trash } from 'lucide-react';

export interface Opportunity {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  skillsRequired: string[];
  maxVolunteers: number;
  status: 'active' | 'completed' | 'cancelled';
  registeredCount?: number;
}

interface OpportunityCardProps {
  opp: Opportunity;
  isRegistered?: boolean;
  onAction?: () => void;
  actionText?: string;
  actionDisabled?: boolean;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewVolunteers?: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opp,
  isRegistered = false,
  onAction,
  actionText,
  actionDisabled = false,
  isAdmin = false,
  onEdit,
  onDelete,
  onViewVolunteers
}) => {
  const formattedDate = new Date(opp.date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const regCount = opp.registeredCount || 0;
  const isFull = opp.maxVolunteers > 0 && regCount >= opp.maxVolunteers;

  return (
    <div className="opportunity-card glass-panel">
      <div className="opp-header">
        <h4 className="opp-title">{opp.title}</h4>
        <span className={`opp-badge ${opp.status}`}>{opp.status}</span>
      </div>
      
      <p className="opp-desc">{opp.description}</p>
      
      <div className="opp-meta">
        <div className="opp-meta-item">
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>
        <div className="opp-meta-item">
          <Clock size={14} />
          <span>{opp.time}</span>
        </div>
        <div className="opp-meta-item">
          <MapPin size={14} />
          <span>{opp.location}</span>
        </div>
        <div className="opp-meta-item">
          <Users size={14} />
          <span>{regCount} / {opp.maxVolunteers === 0 ? 'Unlimited' : opp.maxVolunteers} Registered</span>
        </div>
      </div>
      
      {opp.skillsRequired && opp.skillsRequired.length > 0 && (
        <div className="opp-skills">
          {opp.skillsRequired.map((skill, index) => (
            <span key={index} className="opp-skill-tag">{skill}</span>
          ))}
        </div>
      )}
      
      <div className="opp-actions" style={{ marginTop: 'auto' }}>
        {isAdmin ? (
          <>
            <button onClick={onEdit} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <Edit size={14} /> Edit
            </button>
            <button onClick={onDelete} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}>
              <Trash size={14} /> Delete
            </button>
            {onViewVolunteers && (
              <button onClick={onViewVolunteers} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', marginLeft: 'auto' }}>
                Volunteers
              </button>
            )}
          </>
        ) : (
          onAction && actionText && (
            <button
              onClick={onAction}
              disabled={actionDisabled || (actionText === 'Join' && isFull)}
              className={isRegistered ? 'btn-secondary' : 'btn-primary'}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {actionText === 'Join' && isFull ? 'Event Full' : actionText}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default OpportunityCard;
