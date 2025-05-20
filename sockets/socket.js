import { Server } from 'socket.io'
import User from '../models/User.js'

const onlineUsers = new Map();

export const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('user-online', async (userId) => {
            try {
                console.log(userId);
                onlineUsers.set(userId, socket.id);
                await User.findByIdAndUpdate(userId, { online: true });

                const user = await User.findById(userId).populate('friends');
                user.friends.forEach(friend => {
                    const friendSocket = onlineUsers.get(friend._id.toString());
                    if (friendSocket) {
                        io.to(friendSocket).emit('friend-online', userId);
                    }
                });
            } catch (error) {
                console.error(`Error in user-online event for user ${userId}:`, error);
            }
        });

        socket.on('update-current-song', async ({ userId, songId }) => {
            try {
                await User.findByIdAndUpdate(userId, { currentlyListeningTo: songId });

                const user = await User.findById(userId).populate('friends');
                user.friends.forEach(friend => {
                    const friendSocket = onlineUsers.get(friend._id.toString());
                    if (friendSocket) {
                        io.to(friendSocket).emit('friend-updated-song', { userId, songId });
                    }
                });
            } catch (error) {
                console.error(`Error in update-current-song event for user ${userId}:`, error);
            }
        });

        socket.on('disconnect', async () => {
            try {
                const disconnectedUserId = [...onlineUsers.entries()]
                    .find(([_, sid]) => sid === socket.id)?.[0];

                if (disconnectedUserId) {
                    onlineUsers.delete(disconnectedUserId);
                    await User.findByIdAndUpdate(disconnectedUserId, { online: false });

                    const user = await User.findById(disconnectedUserId).populate('friends');
                    user.friends.forEach(friend => {
                        const friendSocket = onlineUsers.get(friend._id.toString());
                        if (friendSocket) {
                            io.to(friendSocket).emit('friend-offline', disconnectedUserId);
                        }
                    });
                }
            } catch (error) {
                console.error(`Error during disconnect handler for socket ${socket.id}:`, error);
            }
        });
    });

    return io;
};
