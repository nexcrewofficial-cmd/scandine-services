import { Router } from 'express';
import { ShiftController } from './shift.controller.js';
import { authenticateJwt, requireVenueId, requireRole } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);

// Staff self-clocking
router.post('/clock-in', ShiftController.clockIn);
router.post('/clock-out', ShiftController.clockOut);

// Manager / Admin timesheets overview
router.get('/payroll/shifts', requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER), ShiftController.listShifts);

export const shiftRouter = router;
