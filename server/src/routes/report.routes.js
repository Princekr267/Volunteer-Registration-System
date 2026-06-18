import express from 'express';
import { exportVolunteersCsv, exportParticipationCsv } from '../controllers/report.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/volunteers', protect, adminOnly, exportVolunteersCsv);
router.get('/participation', protect, adminOnly, exportParticipationCsv);

export default router;
