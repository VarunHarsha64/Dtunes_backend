import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    likedSongs: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Song' }
    ],
    password: String, //we store hashed password here.
    friends: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    friendRequests: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    sentRequests: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    online: { type: Boolean, default: false },
    
    currentlyListeningTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', default: null }

});

export default mongoose.model('User', userSchema);