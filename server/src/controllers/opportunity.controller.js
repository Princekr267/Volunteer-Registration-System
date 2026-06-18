import Opportunity from '../models/Opportunity.js';
import Registration from '../models/Registration.js';
import VolunteerProfile from '../models/VolunteerProfile.js';

export const getOpportunities = async (req, res) => {
  try {
    const filter = {};
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'active';
    }
    const opportunities = await Opportunity.find(filter).sort({ date: 1 });
    
    // For each opportunity, calculate registered volunteer counts
    const opportunitiesWithCounts = await Promise.all(opportunities.map(async (opp) => {
      const regCount = await Registration.countDocuments({ opportunity: opp._id });
      return {
        ...opp.toObject(),
        registeredCount: regCount
      };
    }));

    res.json(opportunitiesWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOpportunity = async (req, res) => {
  const { title, description, date, time, location, skillsRequired, maxVolunteers } = req.body;

  try {
    const opportunity = await Opportunity.create({
      title,
      description,
      date,
      time,
      location,
      skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : skillsRequired.split(',').map(s => s.trim()),
      maxVolunteers: maxVolunteers ? parseInt(maxVolunteers) : 10
    });
    res.status(201).json(opportunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOpportunity = async (req, res) => {
  const { id } = req.params;
  const { title, description, date, time, location, skillsRequired, maxVolunteers, status } = req.body;

  try {
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    opportunity.title = title || opportunity.title;
    opportunity.description = description || opportunity.description;
    opportunity.date = date || opportunity.date;
    opportunity.time = time || opportunity.time;
    opportunity.location = location || opportunity.location;
    if (skillsRequired !== undefined) {
      opportunity.skillsRequired = Array.isArray(skillsRequired) ? skillsRequired : skillsRequired.split(',').map(s => s.trim());
    }
    opportunity.maxVolunteers = maxVolunteers !== undefined ? parseInt(maxVolunteers) : opportunity.maxVolunteers;
    opportunity.status = status || opportunity.status;

    const updated = await opportunity.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOpportunity = async (req, res) => {
  const { id } = req.params;
  try {
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    await Registration.deleteMany({ opportunity: id });
    await opportunity.deleteOne();

    res.json({ message: 'Opportunity and registrations deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerForOpportunity = async (req, res) => {
  const { opportunityId } = req.body;
  const volunteerId = req.user._id;

  try {
    const profile = await VolunteerProfile.findOne({ user: volunteerId });
    if (!profile || profile.status !== 'approved') {
      return res.status(403).json({ message: 'Your profile registration status is not approved or suspended. Registration denied.' });
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ message: 'Opportunity not found' });
    }

    if (opportunity.status !== 'active') {
      return res.status(400).json({ message: 'Opportunity is no longer active' });
    }

    const currentRegCount = await Registration.countDocuments({ opportunity: opportunityId });
    if (opportunity.maxVolunteers > 0 && currentRegCount >= opportunity.maxVolunteers) {
      return res.status(400).json({ message: 'Opportunity is at full capacity' });
    }

    const registration = await Registration.create({
      opportunity: opportunityId,
      volunteer: volunteerId
    });

    res.status(201).json(registration);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already registered for this opportunity' });
    }
    res.status(500).json({ message: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  const { opportunityId } = req.params;
  const volunteerId = req.user._id;

  try {
    const registration = await Registration.findOne({ opportunity: opportunityId, volunteer: volunteerId });
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status !== 'registered') {
      return res.status(400).json({ message: 'Cannot cancel a registration that has already been verified/attended' });
    }

    await registration.deleteOne();
    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ volunteer: req.user._id })
      .populate('opportunity')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOpportunityRegistrations = async (req, res) => {
  const { id } = req.params;
  try {
    const registrations = await Registration.find({ opportunity: id })
      .populate('volunteer', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRegistrationStatusAndHours = async (req, res) => {
  const { registrationId } = req.params;
  const { status, loggedHours } = req.body;

  if (status && !['registered', 'attended', 'no_show'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const registration = await Registration.findById(registrationId).populate('opportunity');
    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    if (status !== undefined) {
      registration.status = status;
      if (status === 'no_show' || status === 'registered') {
        registration.loggedHours = 0;
      }
    }

    if (loggedHours !== undefined && registration.status === 'attended') {
      registration.loggedHours = parseFloat(loggedHours);
    }

    await registration.save();
    
    // Fetch populated version with volunteer data
    const populated = await Registration.findById(registration._id)
      .populate('volunteer', 'fullName email')
      .populate('opportunity');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
