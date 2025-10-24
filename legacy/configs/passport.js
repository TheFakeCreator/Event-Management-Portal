import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // First, try to find user by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If not found, try to find user by email
          const email = profile.emails[0].value;
          let existingUserByEmail = await User.findOne({ email });
          if (existingUserByEmail) {
            // Link Google account to existing user
            existingUserByEmail.googleId = profile.id;
            existingUserByEmail.name = profile.displayName;
            existingUserByEmail.profilePicture = profile.photos[0].value;
            existingUserByEmail.isVerified = true;
            await existingUserByEmail.save();
            return done(null, existingUserByEmail);
          }
          // Generate a unique username based on email or Google profile name
          let generatedUsername = email.split("@")[0];
          // Ensure username is unique by appending a number if needed
          let existingUser = await User.findOne({
            username: generatedUsername,
          });
          let counter = 1;
          while (existingUser) {
            generatedUsername = `${email.split("@")[0]}${counter}`;
            existingUser = await User.findOne({ username: generatedUsername });
            counter++;
          }
          // Create new user
          user = new User({
            googleId: profile.id,
            email: email,
            username: generatedUsername, // Assign the generated username
            name: profile.displayName,
            profilePicture: profile.photos[0].value,
            isVerified: true, // Mark as verified for Google users
          });
          await user.save();
        } else {
          // If user exists, ensure isVerified is true for Google login
          if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
