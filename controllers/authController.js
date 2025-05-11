import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import User from "../models/User.js";

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, Email and Password are mandatory!",
            })
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({
            success: false,
            message: "User already exists!",
        })

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
            name,
            email,
            password: hashedPassword
        });
        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            message: "User sucessfully Created",
            data: {
                name,
                email,
                token
            }
        })
    } catch (error) {
        console.error("Registeration Error: ", error.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({
            success: false,
            message: "Email, Password are mandatory to login!"
        })

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({
            success: false,
            message: "Invalid Credentials!"
        })

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({
            success: false,
            message: "Invalid Credentails!"
        });

        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            message: "Login Successful!",
            data: {
                name: user.name,
                email,
                token
            }
        })
    } catch (error) {
        console.error("Login Error: ", error.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const logout = (req, res) => {
    //on frontend simply delete the token from storage
    res.status(200).json({
        success: true, 
        message: "Logged out sucessfully!"
    })
}


export const googleCallback = (req, res) => {
  const user = req.user;

  const token = generateToken(user._id);

  // Redirect to frontend with token or return JSON
  return res.redirect(`http://localhost:3000/oauth-success?token=${token}`);
};
