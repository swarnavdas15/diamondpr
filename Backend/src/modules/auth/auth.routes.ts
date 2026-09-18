import { Router } from 'express';
import { loginHandler } from './auth.controller';

const router = Router();

router.post('/login', loginHandler);

export default router;