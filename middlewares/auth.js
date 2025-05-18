import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token, authorization denied',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password'); // attach user to request
    console.log(req.user);
    console.log('Auth Verfied!')
    next();
  } catch (err) {
    console.error('JWT Auth Error:', err);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

export default auth;
