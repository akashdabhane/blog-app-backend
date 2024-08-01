import expressAsyncHandler from "express-async-handler";
import Filter from "bad-words";      // search
import fs from "fs";
import { Post } from "../models/post.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { validateMongodbId } from "../utils/validateMongodbID.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

//CREATE POST
const createPost = expressAsyncHandler(async (req, res) => {
    console.log(req.file);
    const { _id } = req.user;
    validateMongodbId(_id);

    //Check for bad words
    const filter = new Filter();
    const isProfane = filter.isProfane(req.body.title, req.body.description);

    //Block user
    if (isProfane) {
        await User.findByIdAndUpdate(_id, {
            isBlocked: true,
        });

        throw new ApiError(400, "Creating Failed because it contains profane words and you have been blocked");
    }

    if (req.file) {
        //1. Get the path to img
        const localFilePath = `public/images/posts/${req?.file?.filename}`;
        //2.Upload to cloudinary
        const uploadedImage = await uploadOnCloudinary(localFilePath);

        if (!uploadedImage) throw new ApiError(500, "Failed to upload image on cloudinary");
        
        req.body.image = uploadedImage.secure_url;
    }

    try {
        const post = await Post.create({
            ...req.body,
            user: _id,
        });

        return res
            .status(201)
            .json(
                new ApiResponse(201, post, "Post created successfully")
            );
        //Remove uploaded img
        //fs.unlinkSync(localPath);
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to create post");
    }
});

//Fetch all posts
const fetchPosts = expressAsyncHandler(async (req, res) => {
    try {
        const posts = await Post.find({}).populate("user");

        return res
            .status(200)
            .json(
                new ApiResponse(200, posts, "Posts fetched successfully")
            );
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch posts");
    }
});

//Fetch a single post
const fetchPost = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    try {
        const post = await Post.findById(id)
            .populate("user")
            .populate("disLikes")
            .populate("likes");

        //update number of views
        await Post.findByIdAndUpdate(
            id,
            {
                $inc: { numViews: 1 },
            },
            { new: true }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(200, post, "Post fetched successfully")
            );
    } catch (error) {
        throw new ApiError(404, error.message || "Post not found");
    }
});

// Update post
const updatePost = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    try {
        const post = await Post.findByIdAndUpdate(
            id,
            {
                ...req.body,
                user: req.user?._id,
            },
            {
                new: true,
            }
        );

        if (!post) throw new ApiError(404, "Post not found to update");

        return res
            .status(200)
            .json(
                new ApiResponse(200, post, "Post updated successfully")
            );
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to update post");
    }
});

//Delete Post
const deletePost = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    try {
        const post = await Post.findOneAndDelete(id);

        if (!post) throw new ApiError(404, "post not found to delete");

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "post deleted successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to delete post");
    }
});

//Likes
const toggleAddLikeToPost = expressAsyncHandler(async (req, res) => {
    //1.Find the post to be liked
    const { postId } = req.body;
    const loginUserId = req.user._id;

    const post = await Post.findById(postId);
    //3. Find is this user has liked this post?
    const isLiked = post.isLiked;

    //4.Chech if this user has dislikes this post
    const alreadyDisliked = post?.disLikes?.find(
        userId => userId.equals(loginUserId)
    );

    //5.remove the user from dislikes array if exists
    if (alreadyDisliked) {
        const post = await Post.findByIdAndUpdate(
            postId,
            {
                $pull: { disLikes: loginUserId },
                isDisLiked: false,
            },
            { new: true }
        );

        // res.json(post);
    }

    //Toggle
    //Remove the user if he has liked the post
    let updatedPost;
    if (isLiked) {
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $pull: { likes: loginUserId },
                isLiked: false,
            },
            { new: true }
        );
    } else {
        //add to likes
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $push: { likes: loginUserId },
                isLiked: true,
            },
            { new: true }
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPost, "like Post toggled successfully")
        )
});

//disLikes
const toggleAddDislikeToPost = expressAsyncHandler(async (req, res) => {
    //1.Find the post to be disLiked
    const { postId } = req.body;
    const post = await Post.findById(postId);
    //2.Find the login user
    const loginUserId = req.user?._id;
    //3.Check if this user has already disLikes
    const isDisLiked = post?.isDisLiked;
    //4. Check if already like this post
    const alreadyLiked = post?.likes?.find(
        userId => userId.toString() === loginUserId?.toString()
    );
    //Remove this user from likes array if it exists
    if (alreadyLiked) {
        const post = await Post.findOneAndUpdate(
            postId,
            {
                $pull: { likes: loginUserId },
                isLiked: false,
            },
            { new: true }
        );
        // res.json(post);
    }
    //Toggling
    //Remove this user from dislikes if already disliked
    let updatedPost;
    if (isDisLiked) {
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $pull: { disLikes: loginUserId },
                isDisLiked: false,
            },
            { new: true }
        );
    } else {
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                $push: { disLikes: loginUserId },
                isDisLiked: true,
            },
            { new: true }
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPost, "dislike Post toggled successfully")
        )

});

export {
    toggleAddDislikeToPost,
    toggleAddLikeToPost,
    deletePost,
    updatePost,
    createPost,
    fetchPosts,
    fetchPost,
};
