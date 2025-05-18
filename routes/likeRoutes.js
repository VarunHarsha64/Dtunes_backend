import express from 'express'
import auth from '../middlewares/auth.js';
import { getLikedSongs, toggleLikeSong } from '../controllers/likeController.js';
const router = express.Router();

// POST /songs/:id/like
router.post('/togglelike', auth, toggleLikeSong);

// GET /users/liked-songs
router.get('/user-liked-songs', auth, getLikedSongs);

export default router;