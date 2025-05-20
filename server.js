import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import http from 'http';
import connectDB from './config/db.js';
import testRoutes from './routes/testRoutes.js'
import authRoutes from './routes/authRoutes.js'
import songRoutes from './routes/songRoutes.js'
import playlistRoutes from './routes/playlistRoutes.js';
import likeRoutes from './routes/likeRoutes.js'
import friendRoutes from './routes/friendRoutes.js'
import passport from 'passport';
import './config/passport.js'
import { setupSocket } from './sockets/socket.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); //enables cross origin resource sharing otherwise frontend requests will be blocked
app.use(express.json()); //automatically parses the json and makes it available on req.body
app.use(passport.initialize());

// Routes
app.use('/api/song', songRoutes)
app.use('/api/test',testRoutes);
app.use('/api/auth', authRoutes)
app.use('/api/playlist', playlistRoutes)
app.use('/api/like', likeRoutes)
app.use('/api/friend', friendRoutes)

// DB + Server
connectDB();
const io = setupSocket(server);
console.log('Socket.IO server created'); 
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
