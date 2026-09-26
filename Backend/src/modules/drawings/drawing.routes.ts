import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { uploadDrawing } from '../../middlewares/upload.middleware';
import { uploadDrawingHandler, getDrawingsByOrderHandler } from './drawing.controller';

const router = Router();

router.use(authenticateToken);

// Multipart form-data endpoint with uploadDrawing middleware
router.post('/upload', uploadDrawing.single('file'), uploadDrawingHandler);
router.get('/order/:orderId', getDrawingsByOrderHandler);

export default router;