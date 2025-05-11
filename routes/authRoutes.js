import express from 'express';
import { register, login, logout, googleCallback } from '../controllers/authController.js'
import passport from 'passport';

const router = express.Router();

router.post('/register', register); //body - name,email,password
router.post('/login', login); //body - email,password
router.post('/logout', logout); //body - none

router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

// Handle callback
router.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    googleCallback
);


export default router;