import { Router } from 'express';
import accountRoutes from './account';
import healthRoutes from './health';

const router = Router();

// Register all routes
router.use('/accounts', accountRoutes);
router.use('/health', healthRoutes);

export default router;
