import express from 'express';
import { testRouteHandler } from '../controllers/testController.js';

const router = express.Router();

router.post('/',testRouteHandler);

export default router;