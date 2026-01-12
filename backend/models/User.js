const { model, Schema } = require("mongoose");
const userSchema = new Schema(
  {
    name: {
      type: String,
      // required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate emails
      lowercase: true, // Normalize email to lowercase
      trim: true,
    },
    password: {
      type: String,
      required: function () { return !this.googleId },
    },
    tempPassword: {
      type: String, // Temporary password for Google users to show once
    },
    hasSetPassword: {
      type: Boolean,
      default: false, // Track if Google user has set their own password
    },
    verify: {
      type: Boolean,
      default: false
    },
    googleId: {
      type: String,
      required: function () { return !this.password },
    },
    picture: {
      type: String,
      trim: true,
      default: "",  // Empty string - frontend sẽ hiển thị default avatar
    },
    about: {
      type: String
    },
    bookmarks: {
      type: Array,
      default: []
    },
    likes: {
      type: Array,
      default: []
    },
    posts: {
      type: Array,
      default: []
    },
    following: {
      type: Array,
      default: [],
    },
    followerscount: {
      type: Number,
      default: 0,
    },
    followingcount: {
      type: Number,
      default: 0,
    },
    likeslist: {
      type: Map,
      of: Boolean,
    },
    bookmarkslist: {
      type: Map,
      of: Boolean,
    }

  },
  { timestamps: true }
);

module.exports = model("User", userSchema);

