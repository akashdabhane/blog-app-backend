import express from "express"
import { sendEmailMsg } from "../controllers/email.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js"

const emailRouter = express.Router();

emailRouter.post("/", authMiddleware, sendEmailMsg);

export default emailRouter;
