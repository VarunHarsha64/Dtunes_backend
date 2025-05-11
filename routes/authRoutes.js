import express from 'express';
import {register,login,logout} from '../controllers/authController.js'

const router = express.Router();

router.post('/register',register); //body - name,email,password
router.post('/login',login); //body - email,password
router.post('/logout',logout); //body - none

export default router;