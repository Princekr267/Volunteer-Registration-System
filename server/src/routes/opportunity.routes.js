import express from 'express';
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  registerForOpportunity,
  cancelRegistration,
  getMyRegistrations,
  getOpportunityRegistrations,
  updateRegistrationStatusAndHours
} from '../controllers/opportunity.controller.js';
import { protect, adminOnly, optionalProtect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', optionalProtect, getOpportunities);
router.post('/register', protect, registerForOpportunity);
router.delete('/:opportunityId/cancel', protect, cancelRegistration);
router.get('/my-registrations', protect, getMyRegistrations);

router.post('/', protect, adminOnly, createOpportunity);
router.put('/:id', protect, adminOnly, updateOpportunity);
router.delete('/:id', protect, adminOnly, deleteOpportunity);

router.get('/:id/registrations', protect, adminOnly, getOpportunityRegistrations);
router.put('/registrations/:registrationId', protect, adminOnly, updateRegistrationStatusAndHours);

export default router;
