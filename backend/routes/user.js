
const express = require("express");
const keys = require("../config/keys");

const { generateToken } = require("../helper/token");
const {
  getallLikes,
  register,
  login,
  getallBookmarks,
  uploadprofile,
  getUser,
  findOutUser,
  sendResetPasswordCode,
  validateResetCode,
  changePassword,
  setPassword,
  checkHasPassword,
  changeUserPassword,
  bookmark,
  deletebookmark,
  checkbookmark,
  sendreportmails,
  followercount,
  followingcount,
  showbookmark,
  fetchprof,
  showmyposts,
  deletepost,
  fetchfollowing,
  follow,
  checkfollowing,
  unfollow,
  searchresult,
  changeabout,
  likes,
  checklikes,
  deletelikes,
  showLikemark
} = require("../controllers/user");
const {
  sendmail,
  checkifverify,
  verifycode,
  checkotpv
} = require("../controllers/verifyemail")

const {
  google_auth,
  google_auth_callback,
} = require("../controllers/Auth")

var passport = require('passport')
const OAuthStrategy = require('passport-oauth').OAuthStrategy;
var GoogleStrategy = require('passport-google-oidc');

const router = express.Router();
const app = express();
const { authUser, optionalAuth } = require("../middleware/auth");

// Import validation middleware - Requirements 1.1
const {
  registerValidation,
  loginValidation,
  handleValidationErrors
} = require("../middleware/validator");

// Import rate limiters - Requirements 2.1, 5.1-5.5
const {
  authLimiter,
  passwordResetLimiter,
  searchLimiter,
  reportLimiter
} = require("../middleware/security");

// Import CSRF token handler - Requirement 6.2
const { getCSRFToken, setCSRFToken } = require("../middleware/csrf");
// app.use(passport.initialize());
// app.use(passport.session());

// CSRF token endpoint - Requirement 6.2: Frontend SHALL include CSRF tokens
router.get("/csrf-token", setCSRFToken, getCSRFToken);

// Register route with validation - Requirement 1.1
router.post("/register", registerValidation, handleValidationErrors, register);
router.post("/checkotpv", checkotpv);

router.post("/checkifverify", checkifverify);

// Login route with validation and rate limiting - Requirements 1.1, 2.1
router.post("/login", authLimiter, loginValidation, handleValidationErrors, login);
router.post("/sendmail", sendmail);
router.post("/verifycode", verifycode);
router.put("/uploadprofile", authUser, uploadprofile);
router.get("/getUser/:userId", getUser);
router.post("/findOutUser", findOutUser);

// Protected routes requiring authentication - Requirement 3.2
router.post("/getallBookmarks", authUser, getallBookmarks);
router.post("/sendResetPasswordCode", passwordResetLimiter, sendResetPasswordCode);
router.post("/validateResetCode", passwordResetLimiter, validateResetCode);
router.post("/changePassword", passwordResetLimiter, changePassword);
router.post("/setpassword", authUser, setPassword);
router.post("/checkhaspassword", authUser, checkHasPassword);
router.post("/changeuserpassword", authUser, changeUserPassword);

// Bookmark routes - require authentication for state-changing operations
router.post("/setbookmark", authUser, bookmark);
router.post("/deletebookmark", authUser, deletebookmark);
router.post("/checkbookmark", authUser, checkbookmark);

// Likes routes - require authentication for state-changing operations
router.post("/setlikes", authUser, likes);
router.post("/getallLikes", authUser, getallLikes);
router.post("/deletelikes", authUser, deletelikes);
router.post("/checklikes", authUser, checklikes);

router.post("/reportcontent", authUser, reportLimiter, sendreportmails);
router.post("/countfollower", followercount);
router.post("/countfollowing", followingcount);
router.post("/showbookmarks", authUser, showbookmark);
router.post("/showLikemarks", authUser, showLikemark);
router.post("/fetchprof", fetchprof);
router.post("/showmyposts", showmyposts);
router.post("/deletepost", authUser, deletepost);
router.post("/fetchfollowing", fetchfollowing);

// Follow routes - require authentication for state-changing operations
router.post("/startfollow", authUser, follow);
router.post("/unfollow", authUser, unfollow);
router.post("/checkfollow", optionalAuth, checkfollowing);

router.post("/searchresult", searchLimiter, searchresult);

// Profile update - require authentication
router.post("/changeabout", authUser, changeabout);


const register_google = async (req) => {
  try {
    const { name, temail, password, image } = req.body;

    const check = await User.findOne({ temail });
    if (check) {
      return res.status(400).json({
        message:
          "This email already exists,try again with a different email",
      });
    }

    const hashed_password = await bcrypt.hash(password, 10);
    const user = await new User({
      name: name,
      email: temail,
      password: hashed_password,
      verify: true,
      picture: image
    }).save();
    const token = generateToken({ id: user._id.toString() }, "15d");
    res.send({
      id: user._id,
      name: user.name,
      picture: user.picture,
      token: token,
      message: "Register Success !",
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ message: error.message });
  }
}

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT,
//   clientSecret: process.env.GOOGLE_SECRET,
//   callbackURL: `${process.env.REACT_APP_FRONTEND_URL}`,
//   passReqToCallback: true
// },
//   function (req, acc, ref, profile, done) {
//     CSSConditionRule.log(profile)
//     return done(null, profile)
//   }
// ))

// router.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ['profile', 'email'] }, { failureRedirect: '/login/failed', failureMessage: true }),
//   google_auth
// );

// router.get(
//   "/auth/google/callback",
//   passport.authenticate("google", {
//     failureRedirect: "/login/failed"
//   }), 
//   google_auth_callback
// );

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/callback", passport.authenticate("google", {
  successRedirect: `${keys.FRONTEND_URL}/auth/callback`,
  failureRedirect: `${keys.FRONTEND_URL}/auth?error=google_auth_failed`
}))


router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: " Authentication has been failded ! ",
  });
});

router.post("/login/success", async (req, res) => {
  if (req.isAuthenticated()) {
    const token = generateToken({ id: req.user._id.toString() }, "15d");

    // Get fresh user data from DB
    const User = require("../models/User");
    const freshUser = await User.findById(req.user._id);

    const responseData = {
      id: freshUser._id,
      name: freshUser.name,
      picture: freshUser.picture,
      token: token,
      likes: freshUser.likes || [],
      bookmarks: freshUser.bookmarks || [],
      email: freshUser.email,
      role: freshUser.role || 'user',
    };

    // Regenerate session to prevent session fixation attacks after OAuth login
    if (req.session && req.session.regenerate) {
      const passportData = req.session.passport;
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(201).send(responseData);
        }
        // Restore passport session data
        if (passportData) {
          req.session.passport = passportData;
        }
        req.session.userId = req.user._id.toString();
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
          }
          res.status(201).send(responseData);
        });
      });
    } else {
      return res.status(201).send(responseData);
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Un-successfull",
      user: null,
    });
  }
});
//Logout - Requirement 7.5: Secure session termination
router.get("/logout", async (req, res) => {
  try {
    // First logout from passport
    req.logout((err) => {
      if (err) {
        console.error('Passport logout error:', err);
      }
    });

    // Destroy the session completely to prevent session fixation
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });
    }

    // Clear all session-related cookies with proper options
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/'
    };

    res.clearCookie('sessionId', cookieOptions);
    res.clearCookie('session', cookieOptions);

    res.status(200).json({ success: true });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ message: "An error occurred during logout" });
  }
});



module.exports = router;
