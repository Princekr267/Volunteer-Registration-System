import express from 'express';
import dns from 'dns';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Could not configure fallback DNS servers:', e.message);
}
import connectDB from './src/config/db.js';

import authRoutes from './src/routes/auth.routes.js';
import volunteerRoutes from './src/routes/volunteer.routes.js';
import opportunityRoutes from './src/routes/opportunity.routes.js';
import reportRoutes from './src/routes/report.routes.js';

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Volunteer Registration System API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server error occurred' });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
