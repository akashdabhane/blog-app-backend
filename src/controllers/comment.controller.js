import expressAsyncHandler from "express-async-handler";
import { Comment } from "../models/comment.model.js";
import { validateMongodbId } from "../utils/validateMongodbID.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

//Create
const createComment = expressAsyncHandler(async (req, res) => {
    const user = req.user;
    const { postId, description } = req.body;

    if ([postId, description].some(field =>
        field.trim === "" || field.trim === undefined
    )) {
        throw new ApiError(400, "All fields are required");
    }

    validateMongodbId(postId)

    try {
        const comment = await Comment.create({
            post: postId,
            user,
            description,
        });

        return res
            .status(201)
            .json(
                new ApiResponse(201, comment, "Comment created successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to create comment");
    }
});

//fetch all comments
const fetchAllComments = expressAsyncHandler(async (req, res) => {
    try {
        const comments = await Comment.find({}).sort("-created");

        return res
            .status(200)
            .json(
                new ApiResponse(200, comments, "Comments fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch comments");
    }
});

//commet details
const fetchComment = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    try {
        const comment = await Comment.findById(id);

        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "Comment fetched successfully")
            )
    } catch (error) {
        throw new ApiError(404, error.message || "Comment not found");
    }
});

//Update
const updateComment = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    try {
        const update = await Comment.findByIdAndUpdate(
            id,
            {
                post: req.body?.postId,
                user: req?.user,
                description: req?.body?.description,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(200, update, "Comment updated successfully")
            )
    } catch (error) {
        throw new ApiError(400, error.message || "Failed to update comment");
    }
});

//delete
const deleteComment = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    try {
        const comment = await Comment.findByIdAndDelete(id);

        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "Comment deleted successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to delete comment");
    }
});

export {
    deleteComment,
    updateComment,
    createComment,
    fetchAllComments,
    fetchComment,
};
