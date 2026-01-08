const express = require("express");

const { getarticle, getLikes, decreastLike, increaseLike, getallpostdata, newPost, allPost, postcomment, getcomment, increaseView, getView, editPost, deletePost } = require("../controllers/post");
const { authUser } = require('../middleware/auth');
const { postValidation, commentValidation, mongoIdBodyValidation, handleValidationErrors } = require('../middleware/validator');

const router = express.Router();

// Protected routes with validation - Requirement 1.1, 3.2
router.post("/post", authUser, postValidation, handleValidationErrors, newPost);
router.post("/editPost", authUser, postValidation, handleValidationErrors, editPost);
router.delete("/deletePost", authUser, mongoIdBodyValidation('id'), handleValidationErrors, deletePost);

// Public routes with ID validation
router.post("/getarticle", mongoIdBodyValidation('id'), handleValidationErrors, getarticle);
router.post("/getallpost", allPost);

// Comment routes - protected with validation
router.post("/postcomment", authUser, commentValidation, handleValidationErrors, postcomment);
router.post("/getcomment", mongoIdBodyValidation('id'), handleValidationErrors, getcomment);

// View/Like routes with ID validation
router.post("/increaseView", mongoIdBodyValidation('id'), handleValidationErrors, increaseView);
router.post("/getView", mongoIdBodyValidation('id'), handleValidationErrors, getView);
router.post("/getallpostdata", mongoIdBodyValidation('id'), handleValidationErrors, getallpostdata);
router.post("/increaseLike", authUser, mongoIdBodyValidation('id'), handleValidationErrors, increaseLike);
router.post("/decreastLike", authUser, mongoIdBodyValidation('id'), handleValidationErrors, decreastLike);
router.post("/getLikes", mongoIdBodyValidation('id'), handleValidationErrors, getLikes);

module.exports = router;
