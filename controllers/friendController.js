// controllers/friendController.js
import User from "../models/User.js";
import mongoose from "mongoose";

export const sendFriendRequest = async (req, res) => {
  const userId = req.user._id.toString();
  const targetId = req.params.id.toString();

  // 1. Prevent self-add
  if (userId === targetId) {
    return res.status(400).json({ success: false, message: "You can't add yourself." });
  }

  // 2. Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }

  try {
    // 3. Fetch users in parallel
    const [user, target] = await Promise.all([
      User.findById(userId),
      User.findById(targetId)
    ]);

    // 4. Check if users exist
    if (!user || !target) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 5. Prevent if already friends
    if (user.friends.some(id => id.toString() === targetId)) {
      return res.status(400).json({ success: false, message: "Already friends." });
    }

    // 6. Prevent if already sent or received a request
    const alreadySent = user.sentRequests.some(id => id.toString() === targetId);
    const alreadyReceived = target.friendRequests.some(id => id.toString() === userId);

    if (alreadySent || alreadyReceived) {
      return res.status(400).json({ success: false, message: "Friend request already pending." });
    }

    // 7. Push and save updates in parallel
    user.sentRequests.push(target._id);
    target.friendRequests.push(user._id);

    await Promise.all([user.save(), target.save()]);

    res.json({ success: true, message: "Friend request sent." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const acceptFriendRequest = async (req, res) => {
  const userId = req.user._id.toString();           // the one accepting
  const requesterId = req.params.id.toString();     // the one who sent the request

  // 1. Prevent self-friend
  if (userId === requesterId) {
    return res.status(400).json({ success: false, message: "You can't accept your own request." });
  }

  // 2. Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(requesterId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }

  try {
    // 3. Fetch both users in parallel
    const [user, requester] = await Promise.all([
      User.findById(userId),
      User.findById(requesterId)
    ]);

    // 4. Check if both exist
    if (!user || !requester) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 5. Check if request actually exists
    const hasIncoming = user.friendRequests.some(id => id.toString() === requesterId);
    const hasOutgoing = requester.sentRequests.some(id => id.toString() === userId);

    if (!hasIncoming || !hasOutgoing) {
      return res.status(400).json({ success: false, message: "No pending friend request found." });
    }

    // 6. Update both users
    // Add to friends list
    user.friends.push(requester._id);
    requester.friends.push(user._id);

    // Remove friend request entries
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
    requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== userId);

    // 7. Save both in parallel
    await Promise.all([user.save(), requester.save()]);

    res.json({ success: true, message: "Friend request accepted." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friendRequests', 'name email');
    res.json({success:true, data:{friendRequests: user.friendRequests} });
  } catch (err) {
    res.status(500).json({success:false, message: "Server error." });
  }
};

export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('friends', 'name email');
    res.json({success:true, data:{friends: user.friends} });
  } catch (err) {
    res.status(500).json({success:false, message: "Server error." });
  }
};

export const cancelFriendRequest = async (req, res) => {
  const userId = req.user._id.toString();
  const targetId = req.params.id.toString();

  if (userId === targetId) {
    return res.status(400).json({ success: false, message: "Invalid operation." });
  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }

  try {
    const [user, target] = await Promise.all([
      User.findById(userId),
      User.findById(targetId)
    ]);

    if (!user || !target) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const hasSent = user.sentRequests.some(id => id.toString() === targetId);
    const hasReceived = target.friendRequests.some(id => id.toString() === userId);

    if (!hasSent || !hasReceived) {
      return res.status(400).json({ success: false, message: "No pending request to cancel." });
    }

    user.sentRequests = user.sentRequests.filter(id => id.toString() !== targetId);
    target.friendRequests = target.friendRequests.filter(id => id.toString() !== userId);

    await Promise.all([user.save(), target.save()]);

    res.json({ success: true, message: "Friend request canceled." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


export const removeFriend = async (req, res) => {
  const userId = req.user._id.toString();
  const friendId = req.params.id.toString();

  if (userId === friendId) {
    return res.status(400).json({ success: false, message: "You can't unfriend yourself." });
  }

  if (!mongoose.Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }

  try {
    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!user || !friend) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const areFriends = user.friends.some(id => id.toString() === friendId);
    if (!areFriends) {
      return res.status(400).json({ success: false, message: "You are not friends." });
    }

    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);

    await Promise.all([user.save(), friend.save()]);

    res.json({ success: true, message: "Friend removed successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const declineFriendRequest = async (req, res) => {
  const userId = req.user._id.toString();         // the one declining
  const senderId = req.params.id.toString();      // the one who sent the request

  if (userId === senderId) {
    return res.status(400).json({ success: false, message: "Invalid operation." });
  }

  if (!mongoose.Types.ObjectId.isValid(senderId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }

  try {
    const [user, sender] = await Promise.all([
      User.findById(userId),
      User.findById(senderId)
    ]);

    if (!user || !sender) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const hasRequest = user.friendRequests.some(id => id.toString() === senderId);
    const isSent = sender.sentRequests.some(id => id.toString() === userId);

    if (!hasRequest || !isSent) {
      return res.status(400).json({ success: false, message: "No friend request to decline." });
    }

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== senderId);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== userId);

    await Promise.all([user.save(), sender.save()]);

    res.json({ success: true, message: "Friend request declined." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

