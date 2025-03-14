import { Router } from 'express';
import accountRoutes from './accounts.js';
import healthRoutes from './health.js';
import serviceRoutes from './services.js';

const router = Router();

// Register all routes
router.use('/accounts', accountRoutes);
router.use('/health', healthRoutes);
router.use('/services', serviceRoutes);

export default router;
