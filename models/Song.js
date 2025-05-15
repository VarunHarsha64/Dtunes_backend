import mongoose from 'mongoose';

const SongSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    default: 'Unknown Artist',
  },
  duration: {
    type: Number, // in seconds
  },
  lyrics:{
    type: String,
    default: ''
  },
  sourceType: {
    type: String,
    enum: ['upload', 'youtube'],
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Song', SongSchema);
