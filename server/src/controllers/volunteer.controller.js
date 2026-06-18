import VolunteerProfile from '../models/VolunteerProfile.js';
import User from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const profile = await VolunteerProfile.findOne({ user: req.user._id }).populate('user', 'fullName email role');
    if (!profile) {
      return res.status(404).json({ message: 'Volunteer profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const { phone, skills, interests, availability, emergencyContact } = req.body;

  try {
    let profile = await VolunteerProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new VolunteerProfile({ user: req.user._id });
    }

    profile.phone = phone !== undefined ? phone : profile.phone;
    profile.skills = skills !== undefined ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : profile.skills;
    profile.interests = interests !== undefined ? interests : profile.interests;
    profile.availability = availability !== undefined ? availability : profile.availability;
    profile.emergencyContact = emergencyContact !== undefined ? emergencyContact : profile.emergencyContact;

    const updatedProfile = await profile.save();
    
    // Return populated profile
    const populated = await VolunteerProfile.findById(updatedProfile._id).populate('user', 'fullName email role');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVolunteers = async (req, res) => {
  try {
    const profiles = await VolunteerProfile.find().populate('user', 'fullName email role');
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVolunteerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const profile = await VolunteerProfile.findById(id).populate('user', 'fullName email role');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.status = status;
    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
