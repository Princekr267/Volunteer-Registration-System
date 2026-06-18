import mongoose from 'mongoose';

const VolunteerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  interests: {
    type: String,
    trim: true,
    default: ''
  },
  availability: {
    type: [String],
    default: []
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'approved'
  }
}, {
  timestamps: true
});

const VolunteerProfile = mongoose.model('VolunteerProfile', VolunteerProfileSchema);
export default VolunteerProfile;
