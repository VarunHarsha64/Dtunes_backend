import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['public', 'private', 'group'],
    default: 'private',
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song',
  }],
  collaborators: [{  // only for group playlists
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  sharedLink: {  // for private playlists, a unique token or URL
    type: String,
  }
}, { timestamps: true });

const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;
