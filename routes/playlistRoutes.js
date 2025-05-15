import express from 'express';
import {
  createPlaylist,
  updatePlaylist,
  getUserPlaylists,
  getPlaylistBySharedLink,
  regenerateSharedLink,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deletePlaylist,
  addCollaborator,
  removeCollaborator,
  getPlaylistById,
  renamePlaylist,
  getPublicPlaylists,
  duplicatePlaylist,
} from '../controllers/playlistController.js';

import auth from '../middlewares/auth.js';

const router = express.Router();

// Playlist Creation & Update
router.post('/create', auth, createPlaylist);
router.patch('/update', auth, updatePlaylist);
router.put('/rename', auth, renamePlaylist);


// Fetch Playlists
router.get('/user', auth, getUserPlaylists);
router.get('/shared/:sharedLink', auth ,getPlaylistBySharedLink);
router.get('/:playlistId', auth, getPlaylistById);
router.get('/public',auth,getPublicPlaylists);

// Playlist Deletion
router.delete('/delete', auth, deletePlaylist);

// Shared Link Regeneration
router.patch('/regenerate-link', auth, regenerateSharedLink);

// Song Management
router.patch('/add-song', auth, addSongToPlaylist);
router.patch('/remove-song', auth, removeSongFromPlaylist);

// Collaborator Management
router.patch('/add-collaborator', auth, addCollaborator);
router.patch('/remove-collaborator', auth, removeCollaborator);

//Duplicating Playlist
router.post('/duplicate', auth, duplicatePlaylist);



export default router;
