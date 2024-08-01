import express from "express"
import {
    createPost,
    fetchPosts,
    fetchPost,
    updatePost,
    deletePost,
    toggleAddLikeToPost,
    toggleAddDislikeToPost,
} from "../controllers/post.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import {
    photoUpload,
    postImgResize,
} from "../middlewares/photoUpload.js";

const postRouter = express.Router();

postRouter.route("/").post(
    authMiddleware,
    photoUpload.single("image"),
    postImgResize,
    createPost
).get(fetchPosts);

postRouter.put("/likes", authMiddleware, toggleAddLikeToPost);
postRouter.put("/dislikes", authMiddleware, toggleAddDislikeToPost);
postRouter.route("/:id").get(fetchPost).put(updatePost).delete(deletePost)

export default postRouter;
