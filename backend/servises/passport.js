const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require("passport");
const bcrypt = require("bcrypt");
const keys = require("../config/keys")
const User = require('../models/User');

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
  callbackURL: "/auth/google/callback",
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
