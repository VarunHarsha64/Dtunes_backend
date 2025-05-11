import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String, 
        required: true, 
        unique: true
    },
    password: String, //we store hashed password here.
});

export default mongoose.model('User',userSchema);