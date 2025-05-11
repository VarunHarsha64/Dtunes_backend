// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });

            if (!user) {
                user = await User.create({
                    email: profile.emails[0].value,
                    name: profile.displayName,
                    password:""
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }
));

// No need to export anything unless you want to reuse passport
