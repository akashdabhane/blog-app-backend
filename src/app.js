import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

// cross origin requests
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true,
}));

app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// import/load routers
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRouter from "./routes/comment.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);


export { app }
