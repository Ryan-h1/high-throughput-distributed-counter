import { Router } from 'express';
import accountRoutes from './account.js';
import healthRoutes from './health.js';

const router = Router();

// Register all routes
router.use('/accounts', accountRoutes);
router.use('/health', healthRoutes);

export default router;
