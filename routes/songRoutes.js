import express from 'express';
import { upload } from '../middlewares/upload.js';
import { deleteSong, getAllSongs, getMySongs, getSongById, getSongsByArtist, updateSong, uploadSong } from '../controllers/songController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/upload', auth ,upload.single('audio'), uploadSong);
router.delete('/delete',auth,deleteSong);
router.patch('/update', auth, updateSong);

router.get('/',auth ,getAllSongs);
router.get('/artist/:name',auth ,getSongsByArtist);
router.get('/me', auth, getMySongs);
router.get('/id/:id',auth ,getSongById);

export default router;
