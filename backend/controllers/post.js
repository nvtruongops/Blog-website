const Post = require("../models/Post");
const User = require("../models/User");
const { verifyOwnership } = require("../middleware/auth");
const { sanitizeHTML } = require("../middleware/validator");

/**
 * Create a new post
 * Content is sanitized before saving - Requirement 1.2
 */
exports.newPost = async (req, res) => {
  try {
    // Ensure the user creating the post is the authenticated user - Requirement 3.1
    if (!verifyOwnership(req.body.user, req.user.id)) {
      return res.status(403).json({ message: "You can only create posts for your own account" });
    }

    // Sanitize content before saving - Requirement 1.2
    const postData = {
      ...req.body,
      content: sanitizeHTML(req.body.content)
    };

    const newPost = await new Post(postData).save();
    const userData = await User.findById(req.body.user);
    
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    
    userData.posts.push(newPost._id);
    await userData.save();
    await newPost.populate("user", "name picture");
    res.json(newPost);
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while creating the post" });
  }
};

/**
 * Edit an existing post
 * Verifies ownership before allowing edit - Requirement 3.1, 3.3
 * Content is sanitized before saving - Requirement 1.2
 */
exports.editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.body.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Verify ownership - Requirement 3.1, 3.3
    if (!verifyOwnership(post.user, req.user.id)) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    // Update with sanitized content - Requirement 1.2
    post.title = req.body.title;
    post.description = req.body.description;
    post.content = sanitizeHTML(req.body.content);
    post.category = req.body.category;
    post.image = req.body.image;
    
    await post.save();
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while editing the post" });
  }
};

/**
 * Delete a post
 * Verifies ownership before allowing delete - Requirement 3.1, 3.3
 */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.body.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Verify ownership - Requirement 3.1, 3.3
    if (!verifyOwnership(post.user, req.user.id)) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    // Remove post from user's posts array
    await User.findByIdAndUpdate(post.user, {
      $pull: { posts: post._id }
    });

    await Post.findByIdAndDelete(req.body.id);
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while deleting the post" });
  }
};
exports.increaseView = async (req, res) => {
  try {
    const post = await Post.findById(req.body.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.views += 1;
    await post.save();
    res.json({ msg: "ok" });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
};
exports.getView = async (req, res) => {
  try {
    const post = await Post.findById(req.body.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ msg: "ok", view: post.views });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
};
exports.getLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.body.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ msg: "ok", likes: post.likes });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
};
exports.increaseLike = async (req, res) => {
  try {
    const post = await Post.findById(req.body.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.likes += 1;
    await post.save();
    res.json({ msg: "ok" });
  }
  catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
}
exports.decreastLike = async (req, res) => {
  try {
    const post = await Post.findById(req.body.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.likes -= 1;
    if (post.likes < 0) {
      post.likes = 0;
    }
    await post.save();
    return res.json({ msg: "ok" });
  }
  catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
}
/**
 * Post a comment
 * Content is sanitized before saving - Requirement 1.2
 */
exports.postcomment = async (req, res) => {
  try {
    const { name, image, content, commentBy, postId } = req.body;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    // Sanitize comment content - Requirement 1.2
    const newComment = {
      comment: sanitizeHTML(content),
      image: image,
      commentBy: commentBy,
      commentAt: new Date(),
      name: name
    };
    
    post.comments.push(newComment);
    await post.save();
    res.status(201).json({ msg: "ok" });
  } catch (error) {
    res.status(500).json({ msg: "An error occurred" });
  }
}
exports.getallpostdata = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await Post.findById(id);
    if (!data) {
      return res.status(404).json({ msg: "Post not found" });
    }
    return res.status(200).json({ msg: data });
  } catch (error) {
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.getarticle = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await Post.findById(id);
    if (!data) {
      return res.status(404).json({ msg: "!article" });
    }
    const user = await User.findById(data.user).select("name picture about");
    if (!user) {
      // Return article with minimal user info if user not found
      return res.status(200).json({ 
        msg: { 
          ...data.toObject(), 
          user: { name: "Unknown", picture: "", about: "" } 
        } 
      });
    }
    const result = data.toObject();
    result.user = user;
    return res.status(200).json({ msg: result });
  } catch (error) {
    console.error('getarticle error:', error.message);
    return res.status(500).json({ msg: "An error occurred" });
  }
}
exports.getcomment = async (req, res) => {
  try {
    const { id } = req.body;
    const data = await Post.findById(id);
    if (!data) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    // Fetch current user info for each comment to get updated avatars
    const commentsWithUpdatedAvatars = await Promise.all(
      (data.comments || []).map(async (comment) => {
        try {
          const user = await User.findById(comment.commentBy).select('picture name');
          return {
            ...comment.toObject(),
            image: user?.picture || comment.image || '',
            name: user?.name || comment.name
          };
        } catch {
          return comment;
        }
      })
    );
    
    res.status(200).json(commentsWithUpdatedAvatars);
  } catch (error) {
    res.status(500).json({ msg: "An error occurred" });
  }
}
exports.allPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const cat = req.body.mpost;
    
    if (!cat || cat === "" || cat === "all") {
      const skip = (page - 1) * size;
      const total = await Post.countDocuments();
      const posts = await Post.find().skip(skip).limit(size);
      await Promise.all(
        posts.map((post) => post.populate("user", "name picture about"))
      );

      res.status(200).send({
        posts,
        total,
        page,
        size,
      });
    }
    else {
      const skip = (page - 1) * size;
      const posts = await Post.find({ category: cat }).skip(skip).limit(size);
      const total = posts.length;
      await Promise.all(
        posts.map((post) => post.populate("user", "name picture about"))
      );

      res.status(200).send({
        posts,
        total,
        page,
        size,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
};
