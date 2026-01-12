const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require("passport");
const bcrypt = require("bcrypt");
const keys = require("../config/keys")
const User = require('../models/User');

// Debug: Log OAuth config on startup
const callbackURL = keys.BACKEND_URL 
  ? `${keys.BACKEND_URL.trim()}/auth/google/callback` 
  : "/auth/google/callback";
console.log('[OAuth Config]', {
  clientID: keys.GOOGLE_CLIENT_ID ? '***' + keys.GOOGLE_CLIENT_ID.slice(-10) : 'MISSING',
  callbackURL: callbackURL,
  backendURL: keys.BACKEND_URL || 'NOT SET'
});

// Generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

passport.use(new GoogleStrategy({
  clientID: keys.GOOGLE_CLIENT_ID,
  clientSecret: keys.GOOGLE_CLIENT_SECRET,
  callbackURL: callbackURL,
  scope: ["profile", "email"]
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const photoUrl = profile.photos[0]?.value || "";
      
      // Check if user exists by email
      let user = await User.findOne({ email: email });
      
      if (user) {
        // User exists - link Google account if not already linked
        const isFirstGoogleLink = !user.googleId;
        
        if (isFirstGoogleLink) {
          user.googleId = profile.id;
          
          // If user registered with email/password before, they already have a password
          // Mark hasSetPassword as true since they set it during registration
          if (user.password && !user.hasSetPassword) {
            user.hasSetPassword = true;
          }
        }
        
        // Only update picture if user doesn't have one and Google provides one
        if (!user.picture && photoUrl) {
          user.picture = photoUrl;
        }
        
        if (!user.likeslist) {
          user.likeslist = {};
        }
        if (!user.bookmarkslist) {
          user.bookmarkslist = {};
        }
        // Ensure Google users are verified
        user.verify = true;
        await user.save();
        return done(null, user);
      }
      
      // Check if user exists by googleId
      user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Create new user with auto-generated password
      const tempPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      try {
        const newUser = new User({
          googleId: profile.id,
          email: email,
          picture: photoUrl,
          name: profile.displayName,
          password: hashedPassword,
          hasSetPassword: false, // New Google user hasn't set their own password
          verify: true,
          likeslist: {},
          bookmarkslist: {}
        });
        
        await newUser.save();
        return done(null, newUser);
      } catch (saveError) {
        // Handle race condition - user might have been created by another request
        if (saveError.code === 11000) {
          // Duplicate email - fetch the existing user
          const existingUser = await User.findOne({ email: email });
          if (existingUser) {
            return done(null, existingUser);
          }
        }
        throw saveError;
      }
    }
    catch (error) {
      console.error('Google auth error:', error);
      return done(error, null);
    }
  }
));

// passport.serializeUser((user, done) => {
//   done(null, user.id)
// })

// passport.deserializeUser((id, done) => {
//   User.findById(id).then((user) => {
//     done(null, user)
//   })
// })

passport.serializeUser((user, done) => {
  done(null, user);

})

// used to deserialize the user
passport.deserializeUser((user, done) => {
  done(null, user);
})
// passport.initialize();
// passport.session();
