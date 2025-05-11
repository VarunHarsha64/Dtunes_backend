import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import connectDB from './config/db.js';
import testRoutes from './routes/testRoutes.js'
import authRoutes from './routes/authRoutes.js'
import passport from 'passport';
import './config/passport.js'

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); //enables cross origin resource sharing otherwise frontend requests will be blocked
app.use(express.json()); //automatically parses the json and makes it available on req.body
app.use(passport.initialize());

// Routes
app.use('/api/test',testRoutes);
app.use('/api/auth', authRoutes)

// DB + Server
connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
