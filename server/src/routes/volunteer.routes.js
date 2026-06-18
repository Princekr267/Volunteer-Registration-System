import express from 'express';
import { getProfile, updateProfile, getVolunteers, updateVolunteerStatus } from '../controllers/volunteer.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, adminOnly, getVolunteers);
router.put('/:id/status', protect, adminOnly, updateVolunteerStatus);

export default router;
