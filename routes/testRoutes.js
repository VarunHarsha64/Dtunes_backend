import express from 'express';
import { testRouteHandler } from '../controllers/testController.js';

const router = express.Router();

router.post('/test',testRouteHandler);

export default router;