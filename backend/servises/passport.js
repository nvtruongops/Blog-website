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
        // Update existing user - chỉ cập nhật picture nếu user chưa có và Google có ảnh
        if (!user.picture && photoUrl) {
          user.picture = photoUrl;
        }
        if (!user.googleId) {
          user.googleId = profile.id;
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
        tempPassword: tempPassword, // Store temp password to show user once
        hasSetPassword: false,
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
