import mongoose from 'mongoose';
import Opportunity from '../models/Opportunity.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/volunteer_db';
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default opportunities if database is empty
    const count = await Opportunity.countDocuments();
    if (count === 0) {
      console.log('Seeding default volunteer opportunities...');
      await Opportunity.create([
        {
          title: 'Food Bank Distribution & Sorting',
          description: 'Help package and sort emergency food supplies for local community pantries. Tasks include organizing shelves, boxing items, and assisting with loading vehicles.',
          date: new Date('2026-07-15'),
          time: '9:00 AM - 1:00 PM',
          location: 'Community Center Warehouse, Hall B',
          skillsRequired: ['Sorting', 'Heavy Lifting', 'Organization'],
          maxVolunteers: 12,
          status: 'active'
        },
        {
          title: 'Community Garden Spring Planting',
          description: 'Join us for our annual spring planting day! Volunteers will help sow seeds, transplant seedlings, weed plant beds, and set up the greenhouse irrigation lines.',
          date: new Date('2026-07-22'),
          time: '8:00 AM - 12:00 PM',
          location: 'Green Valley Community Gardens, Plot 4',
          skillsRequired: ['Gardening', 'Outdoors', 'Teamwork'],
          maxVolunteers: 15,
          status: 'active'
        },
        {
          title: 'After-School Youth Tutoring',
          description: 'Provide academic tutoring and homework help to middle school students in mathematics, general science, and English. No professional certification required, just patience and clarity.',
          date: new Date('2026-08-05'),
          time: '3:00 PM - 5:30 PM',
          location: 'Downtown Public Library, Study Room 1A',
          skillsRequired: ['Teaching', 'Communication', 'Patience'],
          maxVolunteers: 6,
          status: 'active'
        }
      ]);
      console.log('Default opportunities seeded successfully!');
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Ensure MongoDB is running locally, or configure MONGODB_URI in server/.env');
    console.warn('WARNING: Running server without database connection. Features requiring MongoDB will fail.');
  }
};

export default connectDB;
