import mongoose from 'mongoose'

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Successfully connected with MongoDB");

    } catch (err) {
        console.log(err)
        console.error("MongoDB connection failed: ", err.message);

    }
}

export default connectDB;