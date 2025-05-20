// routes/friends.js
import express from 'express';
import auth from '../middlewares/auth.js';
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getFriendRequests,
  cancelFriendRequest,
  removeFriend,
  declineFriendRequest
} from '../controllers/friendController.js';

const router = express.Router();

router.post('/send-request/:id', auth, sendFriendRequest);
router.post('/accept-request/:id', auth, acceptFriendRequest);
router.get('/requests', auth, getFriendRequests);
router.get('/friends', auth, getFriends);
router.post('/cancel-request/:id', auth, cancelFriendRequest);
router.post('/remove-friend/:id', auth, removeFriend);
router.post('/decline-request/:id',auth,declineFriendRequest);

export default router;
