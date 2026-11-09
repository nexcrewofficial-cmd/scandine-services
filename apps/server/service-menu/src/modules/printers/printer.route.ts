import { Router } from 'express';
import { PrinterController } from './printer.controller.js';
import { authenticateJwt, requireVenueId, requireRole } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get('/', PrinterController.list);
router.post('/', PrinterController.create);
router.put('/:id', PrinterController.update);
router.delete('/:id', PrinterController.delete);

export const printerRouter = router;
