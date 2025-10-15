import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import User from '../models/user.model.js';

interface GoogleStrategyConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

/**
 * Validates Google OAuth environment variables
 */
const validateGoogleConfig = (): GoogleStrategyConfig => {
  const config = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  };

  if (!config.clientID || !config.clientSecret || !config.callbackURL) {
    throw new Error(
      'Missing required Google OAuth environment variables. Please ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are set.'
    );
  }

  return config as GoogleStrategyConfig;
};

/**
 * Generates a unique username based on email
 */
const generateUniqueUsername = async (email: string): Promise<string> => {
  let generatedUsername = email.split('@')[0];
  let existingUser = await User.findOne({ username: generatedUsername });
  let counter = 1;

  while (existingUser) {
    generatedUsername = `${email.split('@')[0]}${counter}`;
    existingUser = await User.findOne({ username: generatedUsername });
    counter++;
  }

  return generatedUsername;
};

/**
 * Google OAuth strategy callback handler
 */
const googleStrategyCallback = async (
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: VerifyCallback
): Promise<void> => {
  try {
    // First, try to find user by googleId
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      // If not found, try to find user by email
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Google profile'), undefined);
      }

      const existingUserByEmail = await User.findOne({ email });

      if (existingUserByEmail) {
        // Link Google account to existing user
        existingUserByEmail.googleId = profile.id;
        existingUserByEmail.name =
          profile.displayName || existingUserByEmail.name;
        existingUserByEmail.avatar =
          profile.photos?.[0]?.value || existingUserByEmail.avatar;
        existingUserByEmail.isVerified = true;
        await existingUserByEmail.save();
        return done(null, existingUserByEmail);
      }

      // Generate a unique username
      const generatedUsername = await generateUniqueUsername(email);

      // Create new user
      user = new User({
        googleId: profile.id,
        email,
        username: generatedUsername,
        name: profile.displayName || 'Google User',
        avatar: profile.photos?.[0]?.value || '',
        isVerified: true, // Mark as verified for Google users
        gender: 'other', // Default value, user can update later
        phone: '', // Default empty, user can add later
        bio: '', // Default empty
        socials: {}, // Default empty object
        clubs: [],
        moderatorClubs: [],
        createdEvents: [],
        participatedEvents: [],
        role: 'user',
        failedLoginAttempts: 0,
        isDeleted: false,
        lastPasswordChange: new Date(),
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
    console.error('Google OAuth error:', error);
    return done(error as Error, undefined);
  }
};

// Validate configuration and set up Google strategy
const config = validateGoogleConfig();

passport.use(
  new GoogleStrategy(
    {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
    },
    googleStrategyCallback
  )
);

// Serialize user for session
passport.serializeUser<string>((user: any, done) => {
  done(null, user.id || user._id);
});

// Deserialize user from session
passport.deserializeUser<string>(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Passport deserialize error:', error);
    done(error as Error, null);
  }
});

export default passport;
