import VolunteerProfile from '../models/VolunteerProfile.js';
import Registration from '../models/Registration.js';

export const exportVolunteersCsv = async (req, res) => {
  try {
    const profiles = await VolunteerProfile.find().populate('user', 'fullName email role');
    
    let csv = 'Full Name,Email,Phone,Skills,Interests,Availability,Status,Created At\r\n';
    
    profiles.forEach(profile => {
      if (!profile.user) return; // Skip if user deleted
      
      const name = `"${profile.user.fullName.replace(/"/g, '""')}"`;
      const email = `"${profile.user.email.replace(/"/g, '""')}"`;
      const phone = `"${(profile.phone || '').replace(/"/g, '""')}"`;
      const skills = `"${profile.skills.join(', ').replace(/"/g, '""')}"`;
      const interests = `"${(profile.interests || '').replace(/"/g, '""')}"`;
      const availability = `"${profile.availability.join(', ').replace(/"/g, '""')}"`;
      const status = `"${profile.status}"`;
      const createdAt = `"${new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}"`;
      
      csv += `${name},${email},${phone},${skills},${interests},${availability},${status},${createdAt}\r\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=volunteers_report.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportParticipationCsv = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('opportunity')
      .populate('volunteer', 'fullName email');
      
    let csv = 'Opportunity Title,Date,Location,Volunteer Name,Volunteer Email,Status,Hours Logged\r\n';
    
    registrations.forEach(reg => {
      if (!reg.opportunity || !reg.volunteer) return;
      
      const oppTitle = `"${reg.opportunity.title.replace(/"/g, '""')}"`;
      const date = `"${new Date(reg.opportunity.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}"`;
      const location = `"${reg.opportunity.location.replace(/"/g, '""')}"`;
      const volName = `"${reg.volunteer.fullName.replace(/"/g, '""')}"`;
      const volEmail = `"${reg.volunteer.email.replace(/"/g, '""')}"`;
      const status = `"${reg.status}"`;
      const hours = `"${reg.loggedHours}"`;
      
      csv += `${oppTitle},${date},${location},${volName},${volEmail},${status},${hours}\r\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=participation_report.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
