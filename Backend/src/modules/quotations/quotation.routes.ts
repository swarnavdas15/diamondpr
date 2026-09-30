import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import {
  handleListQuotations,
  handleCreateQuotation,
  handleUpdateQuotation,
  handleAddQuotationFollowUp,
} from './quotation.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', handleListQuotations);
router.post('/', handleCreateQuotation);
router.patch('/:id', handleUpdateQuotation);
router.post('/:id/follow-up', handleAddQuotationFollowUp);

export default router;
