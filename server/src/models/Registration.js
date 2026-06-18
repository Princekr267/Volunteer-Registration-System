import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema({
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'no_show'],
    default: 'registered'
  },
  loggedHours: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Avoid duplicate registrations of a volunteer to the same opportunity
RegistrationSchema.index({ opportunity: 1, volunteer: 1 }, { unique: true });

const Registration = mongoose.model('Registration', RegistrationSchema);
export default Registration;
