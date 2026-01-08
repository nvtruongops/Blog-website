const { validateEmail, validateLength } = require("../helper/validation");
const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");
const { generateToken } = require("../helper/token");
const Code = require('../models/Code');
const { sendResetCode } = require("../helper/mail");
const { sendReportMail } = require("../helper/reportmail");
const generateCode = require("../helper/gen_code");
const { verifyOwnership } = require("../middleware/auth");
const { logSecurityEvent, SecurityEventType } = require("../helper/securityLogger");

// Bcrypt cost factor - minimum 12 for security (Requirement 2.5)
const BCRYPT_COST_FACTOR = 12;


exports.sendreportmails = async (req, res) => {
  try {
    const {
      pid,
      postid,
      userid,
      name1,
      name2,
      reason
    } = req.body;
    const reporter = await User.findById(userid);
    const reported = await User.findById(postid);
    if (!reporter || !reported) {
      return res.status(404).json({ msg: "User not found" });
    }
    var emailr = reporter.email
    var emailrd = reported.email
    var namer = reporter.name
    var namerd = reported.name
    try {
      sendReportMail(emailr, emailrd, namer, namerd, reason, pid);
    } catch (error) {
      // Log error internally but don't expose details
    }
    return res.status(200).json({ msg: "ok" });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.register = async (req, res) => {
  try {
    const { name, temail, password } = req.body;
    if (!validateLength(name, 1, 50)) {
      return res
        .status(400)
        .json({ message: "Tên phải từ 1 đến 50 ký tự!" });
    }
    if (!validateEmail(temail)) {
      return res.status(400).json({ message: "Please enter a valid email !" });
    }

    if (!validateLength(password, 6, 50)) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải từ 6 đến 50 ký tự!" });
    }

    const check = await User.findOne({ email: temail });
    if (check) {
      return res.status(400).json({
        message:
          "Email này đã được đăng ký, vui lòng dùng email khác",
      });
    }

    // Use bcrypt cost factor of 12 for security (Requirement 2.5)
    const hashed_password = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const user = await new User({
      name: name,
      email: temail,
      password: hashed_password,
      verify: true,
      likeslist:{},
      bookmarkslist:{},
    }).save();
    const token = generateToken({ id: user._id.toString() }, "15d");
    res.send({
      id: user._id,
      name: user.name,
      picture: user.picture,
      token: token,
      message: "Register Success !",
      likes:[],
      bookmarks:[],
    });
  } catch (error) {
    // Log error internally but don't expose details (Requirement 8.1)
    logSecurityEvent(SecurityEventType.INVALID_INPUT, {
      ip: req.ip,
      endpoint: `${req.method} ${req.originalUrl}`,
      userAgent: req.get('User-Agent'),
      message: 'Registration error'
    });
    return res.status(500).json({ message: "An error occurred during registration" });
  }
};
exports.deletebookmark = async (req, res) => {
  try {
    const {
      postid,
      userid
    } = req.body;
    
    // Authorization check: verify user can only modify their own bookmarks (Requirement 3.1)
    if (!req.user || !verifyOwnership(userid, req.user.id)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Unauthorized bookmark deletion attempt'
      });
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    var m = user.bookmarks;
    var f = 0;
    if (m.length == 0) {
      return res.status(202).json({ msg: "Does not exists" });
    }
    else {
      for (var i = 0; i < m.length; i++) {
        if (m[i] == postid) {
          f = 1;
          m.splice(i, 1);
        }
      }
      user.bookmarks = m;
      if(user.bookmarkslist){
        if(user.bookmarkslist.has(`${postid}`)){
        user.bookmarkslist.delete(`${postid}`);
        }
      }
      user.save();
      if (f == 1) {
        return res.status(202).json({ msg: "deleted" });
      }
      else {
        return res.status(202).json({ msg: "not found" });
      }

    }
  }
  catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.deletelikes = async (req, res) => {
  try {
    const {
      postid,
      userid
    } = req.body;
    
    // Authorization check: verify user can only modify their own likes (Requirement 3.1)
    if (!req.user || !verifyOwnership(userid, req.user.id)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Unauthorized likes deletion attempt'
      });
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    var m = user.likes;
    var f = 0;
    if (m.length == 0) {
      return res.status(202).json({ msg: "Does not exists" });
    }
    else {
      for (var i = 0; i < m.length; i++) {
        if (m[i] == postid) {
          f = 1;
          m.splice(i, 1);
        }
      }
      user.likes = m;
      if(user.likeslist){
        if(user.likeslist.has(`${postid}`)){
        user.likeslist.delete(`${postid}`);
        }
      }
      user.save();
      if (f == 1) {
        return res.status(202).json({ msg: "deleted" });
      }
      else {
        return res.status(202).json({ msg: "not found" });
      }
    }
  }
  catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.checklikes = async (req, res) => {
  try {
    const {
      postid,
      userid
    } = req.body;
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    var m = user.likes;
    if (m.length == 0) {
      return res.status(202).json({ msg: "Does not exist" });
    }
    else {
      if(user.likeslist){
        if(user.likeslist.has(`${postid}`)){
          return res.status(202).json({ msg: "ok" });
        }
      }
      for (var i = 0; i < m.length; i++) {
        if (m[i] == postid) {
          return res.status(202).json({ msg: "ok" });
        }
      }
      return res.status(202).json({ msg: "Does not exists" });
    }
  }
  catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.getallLikes = async (req, res) => {
  try {
    const {
      userid
    } = req.body;
    
    // Authorization check: verify user can only access their own likes (Requirement 3.1)
    if (!req.user || !verifyOwnership(userid, req.user.id)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Unauthorized likes access attempt'
      });
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    
    const user = await User.findOne({ _id: userid }).select("likes");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    return res.status(201).json(user.likes);
  }
  catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.getallBookmarks = async (req, res) => {
  try {
    const {
      userid
    } = req.body;
    
    // Authorization check: verify user can only access their own bookmarks (Requirement 3.1)
    if (!req.user || !verifyOwnership(userid, req.user.id)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Unauthorized bookmarks access attempt'
      });
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    
    const user = await User.findOne({ _id: userid }).select("bookmarks");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    return res.status(201).json(user.bookmarks);
  }
  catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.checkbookmark = async (req, res) => {
  try {
    const {
      postid,
      userid
    } = req.body;
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    var m = user.bookmarks;
    if (m.length == 0) {
      return res.status(202).json({ msg: "Does not exist" });
    }
    else {
      if(user.bookmarkslist){
        if(user.bookmarkslist.has(`${postid}`)){
          return res.status(202).json({ msg: "ok" });
        }
      }
      for (var i = 0; i < m.length; i++) { 
        if (m[i] == postid) {
          return res.status(202).json({ msg: "ok" });
        }
      }
      return res.status(202).json({ msg: "Does not exists" });
    }
  }
  catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.fetchprof = async (req, res) => {
  try {
    const { id } = req.body
    const data = await User.findById(id);
    if (!data) {
      return res.status(404).json({ msg: "User not found" });
    }
    const resp = {
      name: data.name,
      picture: data.picture,
      about: data.about,
      _id: id
    }
    return res.status(200).json({ msg: resp })
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.bookmark = async (req, res) => {
  try {
    const {
      postid,
      userid
    } = req.body;
    
    // Authorization check: verify user can only modify their own bookmarks (Requirement 3.1)
    if (!req.user || !verifyOwnership(userid, req.user.id)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Unauthorized bookmark creation attempt'
      });
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    
    const user = await User.findOne({ _id: userid });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    var m = user.bookmarks;
    var f = 0;
    if (m.length == 0) {
      m.push(postid);
    }
    else {
      for (var i = 0; i < m.length; i++) {
        if (m[i] == postid) {
          f = 1;
          m.splice(i, 1);
          m.push(postid);
          break;
        }
      }
      if (f === 0) {
        m.push(postid);
      }
      user.bookmarks = m;
    }
    user.bookmarkslist.set(`${postid}`,true);
    user.save();
    if (f == 1) {
      return res.status(202).json({ msg: "exists" });
    }
    else {
      return res.status(202).json({ msg: "ok" });
    }
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.likes = async (req, res) => {
  try {
    const {
      postid,
      userid
    } = req.body;
    
    // Authorization check: verify user can only modify their own likes (Requirement 3.1)
    if (!req.user || !verifyOwnership(userid, req.user.id)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Unauthorized likes creation attempt'
      });
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    
    var mt = await User.findOne({ _id: userid }).select("likes likeslist");
    if (!mt) {
      return res.status(404).json({ msg: "User not found" });
    }
    var m = mt.likes;
    var f = 0;
    if (m.length == 0) {
      m.push(postid);
    }
    else {
      for (var i = 0; i < m.length; i++) {
        if (m[i] == postid) {
          f = 1;
          m.splice(i, 1);
          m.push(postid);
          break;
        }
      }
      if (f == 0) {
        m.push(postid);
      }
    }
    mt.likes = m;
    mt.likeslist.set(`${postid}`,true);
    mt.save();
    if (f == 1) {
      return res.status(202).json({ msg: "exists" });
    }
    else {
      return res.status(202).json({ msg: "ok" });
    }
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.showbookmark = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await User.findById(id).select("bookmarks bookmarkslist");
    if (!data) {
      return res.status(404).json({ msg: "User not found" });
    }
    if(data.bookmarks.length==0){
      return res.status(200).json({ msg: [] });
    }
    var arr = data.bookmarks;
    var respon = [];
    var img = "";
    var title = "";
    var desc = "";
    var imgp = "";
    var name = "";
    var userid = "";
    var postid = "";
    var darr = []
    for (var i = 0; i < arr.length; i++) {
      var pd = await Post.findById(arr[i]);
      if (!pd) {
        continue;
      }
      darr.push(arr[i]);
      img = pd.image;
      title = pd.title;
      desc = pd.description;
      userid = pd.user;
      var ud = await User.findById(userid);
      if (!ud) continue;
      imgp = ud.picture;
      name = ud.name;
      _id = arr[i];
      const utcTimeString = pd.createdAt;
      const date = new Date(utcTimeString);
      respon.push({
        image: img,
        title: title,
        description: desc,
        user: {
          picture: imgp,
          name: name,
          _id: userid,
        },
        book: true,
        createdAt: date,
        _id: _id,
        views: pd.views,
      })
    }
    if (arr.length != darr.length) data.bookmarks = darr;
    await data.save();

    return res.status(200).json({ msg: respon });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.showLikemark = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await User.findById(id).select("likes");
    if (!data) {
      return res.status(404).json({ msg: "User not found" });
    }
    if(data.likes.length==0){
      return res.status(200).json({ msg: [] });
    }
    var arr = data.likes;
    var respon = [];
    var img = "";
    var title = "";
    var desc = "";
    var imgp = "";
    var name = "";
    var userid = "";
    var postid = "";
    var darr = []
    for (var i = 0; i < arr.length; i++) {
      var pd = await Post.findById(arr[i]);
      if (!pd) {
        continue;
      }
      darr.push(arr[i]);
      img = pd.image;
      title = pd.title;
      desc = pd.description;
      userid = pd.user;
      var ud = await User.findById(userid);
      if (!ud) continue;
      imgp = ud.picture;
      name = ud.name;
      _id = arr[i];
      const utcTimeString = pd.createdAt;
      const date = new Date(utcTimeString);
      respon.push({
        image: img,
        title: title,
        description: desc,
        user: {
          picture: imgp,
          name: name,
          _id: userid,
        },
        book: true,
        createdAt: date,
        _id: _id,
        views: pd.views,
      })
    }
    if (arr.length != darr.length) data.likes = darr;
    await data.save();

    return res.status(200).json({ msg: respon });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.showmyposts = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await User.findById(id)
    if (!data) {
      return res.status(404).json({ msg: "User not found" });
    }

    var arr = data.posts;
    var respon = [];
    var img = "";
    var title = "";
    var desc = "";
    var imgp = "";
    var name = "";
    var userid = "";
    var _id = "";
    var view = "";
    var likes="";
    for (var i = 0; i < arr.length; i++) {
      var pd = await Post.findById(arr[i]);
      if (!pd) {
        data.posts.splice(i, 1);
        continue;
      }
      if (pd.views) {
        view = pd.views;
      }
      img = pd.image;
      title = pd.title;
      desc = pd.description;
      userid = pd.user;
      var ud = await User.findById(userid);
      if (!ud) continue;
      imgp = ud.picture;
      name = ud.name;
      _id = arr[i];
      var likes= pd.likes?pd.likes:0;
      const utcTimeString = pd.createdAt;
      const date = new Date(utcTimeString);
      respon.push({
        image: img,
        title: title,
        description: desc,
        user: {
          picture: imgp,
          name: name,
          _id: userid,
        },
        createdAt: date,
        _id: _id,
        views: pd.views,
        createdAt: date,
        powner: true,
        book: false,
        likes:likes,
      })
    }
    data.save();
    return res.status(200).json({ msg: respon });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.showyourposts = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await User.findById(id)
    if (!data) {
      return res.status(404).json({ msg: "User not found" });
    }
    var arr = data.posts;
    var respon = [];
    var img = "";
    var title = "";
    var desc = "";
    var postid = "";
    for (var i = 0; i < arr.length; i++) {
      var pd = await Post.findById(arr[i]);
      if (!pd) continue;
      img = pd.image;
      title = pd.title;
      desc = pd.description;
      postid = arr[i];
      respon.push({
        img: img,
        title: title,
        desc: desc,
        postid: postid
      })
    }
    return res.status(200).json({ msg: respon });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.follow = async (req, res) => {
  try {
    const { id, id2 } = req.body;
    
    // Prevent user from following themselves
    if (id === id2) {
      return res.status(400).json({ msg: "You cannot follow yourself" });
    }
    
    const user = await User.findById(id);
    const user2 = await User.findById(id2);
    
    if (!user || !user2) {
      return res.status(404).json({ msg: "User not found" });
    }

    var mm = user2.followerscount;
    mm = mm + 1;
    user2.followerscount = mm;
    user2.save();
    var f = 0;
    var m = user.following;
    if (m.length == 0) {
      user.following.push(id2);
    }
    else {
      for (var i = 0; i < m.length; i++) {
        if (m[i] == id2) {
          f = 1;
          m.splice(i, 1);
          m.push(id2);
        }
      }
      if (!f) {
        m.push(id2);
      }

      user.following = m;
    }
    user.followingcount = user.followingcount + 1;
    user.save();
    return res.status(200).json({ msg: "ok" });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.followercount = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    var count = user.followerscount;
    return res.status(200).json({ msg: count });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.followingcount = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    var count = user.followingcount;
    return res.status(200).json({ msg: count });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.unfollow = async (req, res) => {
  try {
    const { id, id2 } = req.body;
    const user = await User.findById(id);
    const user2 = await User.findById(id2);
    
    if (!user || !user2) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    var mm = user2.followerscount
    if (mm - 1 < 0) {
      mm = 0;
    }
    else {
      mm = mm - 1;
    }
    user2.followerscount = mm;
    user2.save();
    var f = 0;
    var m = user.following;
    if (m.length == 0) {
      return res.status(200).json({ msg: "ok" });
    }
    else {
      for (var i = 0; i < m.length; i++) {
        if (m[i] == id2) {
          f = 1;
          m.splice(i, 1);
        }
      }
      user.following = m;
    }
    var fc = user.followingcount;
    fc = fc - 1;
    if (fc < 0) {
      fc = 0;
    }
    user.followingcount = fc;
    user.save();
    return res.status(200).json({ msg: "ok" });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.fetchfollowing = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const arr = user.following;
    const resp = [];
    var name = "";
    var pic = "";
    var pid = "";
    for (var i = 0; i < arr.length; i++) {
      var dat = await User.findById(arr[i]);
      if (!dat) continue;
      name = dat.name;
      pic = dat.picture;
      pid = arr[i];
      resp.push({
        name: name,
        pic: pic,
        pid: pid
      })
    }
    return res.status(200).json({ msg: resp });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.changeabout = async (req, res) => {
  try {
    const { about, id } = req.body;
    
    // Authorization check: verify user can only modify their own profile (Requirement 3.1)
    if (!req.user || !verifyOwnership(id, req.user.id)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Unauthorized profile modification attempt'
      });
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    user.about = about;
    user.save();
    return res.status(200).json({ msg: "Saved successfully" });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.searchresult = async (req, res) => {
  try {
    const { id2 } = req.body;
    const data = await User.find({ "name": { $regex: '^' + `${id2}`, $options: 'i' } });
    if (data.length === 0) {
      return res.status(200).json({ msg: [] });
    }
    var names = [];
    for (var i = 0; i < data.length; i++) {
      var name = data[i].name;
      var id = data[i]._id;
      var pic = data[i].picture;
      names.push({
        name: name,
        id: id,
        pic: pic
      })
    }
    return res.status(200).json({ msg: names });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}

exports.checkfollowing = async (req, res) => {
  try {
    const { id, id2 } = req.body;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const arr = user.following;
    if (arr.length == 0) {
      return res.status(200).json({ msg: "not" });
    }
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === id2) {
        return res.status(200).json({ msg: "ok" });
      }
    }
    return res.status(200).json({ msg: "not" });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}

exports.deletepost = async (req, res) => {
  try {
    const { postid, userid } = req.body;
    
    // Authorization check: verify user can only delete their own posts (Requirement 3.1)
    if (!req.user || !verifyOwnership(userid, req.user.id)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Unauthorized post deletion attempt'
      });
      return res.status(403).json({ msg: "Unauthorized access" });
    }
    
    // Verify the post belongs to the user
    const post = await Post.findById(postid);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    if (!verifyOwnership(post.user, userid)) {
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        ip: req.ip,
        userId: req.user?.id,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Attempt to delete another user\'s post'
      });
      return res.status(403).json({ msg: "You can only delete your own posts" });
    }
    
    await Post.deleteOne({ _id: postid });
    var datas = await User.findById(userid);
    if (!datas) {
      return res.status(404).json({ msg: "User not found" });
    }
    var arr = datas.posts;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] == postid) {
        arr.splice(i, 1);
        break;
      }
    }
    datas.posts = arr;
    await datas.save();
    return res.status(200).json({ msg: "ok" });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.login = async (req, res) => {
  try {
    const { temail, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email: temail });
    
    if (!user) {
      // Log failed login attempt but don't reveal if email exists (Requirement 8.1)
      logSecurityEvent(SecurityEventType.AUTH_FAILURE, {
        ip: req.ip,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Login attempt with non-existent email'
      });
      return res.status(400).json({
        message: "Email chưa được đăng ký.",
      });
    }
    
    // Check if Google user has set their own password
    if (user.googleId && !user.hasSetPassword) {
      return res.status(400).json({
        message: "Tài khoản này đăng nhập bằng Google. Vui lòng đăng nhập bằng Google hoặc vào Profile để đặt mật khẩu.",
      });
    }
    
    const check = await bcrypt.compare(password, user.password);
    if (!check) {
      // Log failed login attempt (Requirement 8.2)
      logSecurityEvent(SecurityEventType.AUTH_FAILURE, {
        ip: req.ip,
        userId: user._id.toString(),
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Invalid password attempt'
      });
      return res.status(400).json({
        message: "Mật khẩu không đúng. Vui lòng thử lại.",
      });
    }
    
    // Log successful login (Requirement 8.2)
    logSecurityEvent(SecurityEventType.AUTH_SUCCESS, {
      ip: req.ip,
      userId: user._id.toString(),
      endpoint: `${req.method} ${req.originalUrl}`,
      userAgent: req.get('User-Agent'),
      message: 'Successful login'
    });
    
    const token = generateToken({ id: user._id.toString() }, "15d");
    res.send({
      id: user._id,
      name: user.name,
      picture: user.picture,
      token: token,
      bookmark: user.bookmarks,
      likes: user.likes,
      email: user.email,
    });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred during login" });
  }
};
exports.uploadprofile = async (req, res) => {
  try {
    const { picture, about } = req.body;
    
    // Authorization is already handled by authUser middleware
    // req.user.id is set by the auth middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      picture: picture,
      about: about,
    });
    res.status(200).json({ picture, about });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred" });
  }
};
exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    // Exclude sensitive fields from response (Requirement 12.6)
    const user = await User.findById(userId).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred" });
  }
};
exports.findOutUser = async (req, res) => {
  try {
    const { email } = req.body;
    // Exclude sensitive fields from response (Requirement 12.6)
    const user = await User.findOne({ email: email }).select('-password -__v');
    if (user) {
      if (!user.googleId) {
        res.status(200).json(user);
      }
      else {
        return res.status(400).json({ message: "You have account associated with google, trying signing up again using google" });
      }
    } else {
      res.status(404).json({ message: "no such user exists" });
    }
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred" });
  }
};
exports.sendResetPasswordCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (Requirement 8.1)
      return res.status(200).json({
        message: "If the email exists, a reset code has been sent",
      });
    }
    await Code.findOneAndRemove({ user: user._id });
    const code = generateCode(5);
    const savedCode = await new Code({
      code,
      user: user._id,
    }).save();
    sendResetCode(user.email, user.name, code);
    return res.status(200).json({
      message: "Email reset code has been sent to your email",
    });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred" });
  }
};
exports.validateResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }
    const Dbcode = await Code.findOne({ user: user._id });
    if (!Dbcode || Dbcode.code !== code) {
      return res.status(400).json({
        message: "Verification code is wrong!",
      });
    }
    return res.status(200).json({ message: "ok" });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred" });
  }
};
exports.changePassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Use bcrypt cost factor of 12 for security (Requirement 2.5)
    const cryptedPassword = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    await User.findOneAndUpdate(
      { email },
      {
        password: cryptedPassword,
      }
    );
    return res.status(200).json({ message: "ok" });

  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.setPassword = async (req, res) => {
  const { userid, password } = req.body;
  try {
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    // Use bcrypt cost factor of 12 for security (Requirement 2.5)
    const cryptedPassword = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    await User.findByIdAndUpdate(userid, {
      password: cryptedPassword,
      hasSetPassword: true,
      tempPassword: undefined
    });
    return res.status(200).json({ message: "ok", success: true });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.checkHasPassword = async (req, res) => {
  const { userid } = req.body;
  try {
    const user = await User.findById(userid).select('hasSetPassword googleId');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // User has password if: hasSetPassword is true OR they don't have googleId (registered normally)
    const hasPassword = user.hasSetPassword || !user.googleId;
    return res.status(200).json({ hasPassword, isGoogleUser: !!user.googleId });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ message: "An error occurred" });
  }
};

exports.changeUserPassword = async (req, res) => {
  const { userid, oldPassword, newPassword } = req.body;
  try {
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }
    
    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại" });
    }
    
    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      // Log failed password change attempt (Requirement 8.2)
      logSecurityEvent(SecurityEventType.AUTH_FAILURE, {
        ip: req.ip,
        userId: userid,
        endpoint: `${req.method} ${req.originalUrl}`,
        userAgent: req.get('User-Agent'),
        message: 'Invalid old password during password change'
      });
      return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng" });
    }
    
    // Use bcrypt cost factor of 12 for security (Requirement 2.5)
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_COST_FACTOR);
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    // Don't expose system details (Requirement 8.1)
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};




