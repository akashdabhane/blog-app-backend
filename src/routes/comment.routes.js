import express from "express";
import {
    createComment,
    fetchAllComments,
    fetchComment,
    updateComment,
    deleteComment,
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js"

const commentRouter = express.Router();

commentRouter.use(authMiddleware);

commentRouter.route("/").post(createComment).get(fetchAllComments);
commentRouter.route("/:id").get(fetchComment).put(updateComment).delete(deleteComment);

export default commentRouter;
