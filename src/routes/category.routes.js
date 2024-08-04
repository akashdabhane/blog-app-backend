import express from "express";
import {
    createCategory,
    fetchCategories,
    fetchCategory,
    updateCategory,
    deleteCateory,
} from "../controllers/category.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const categoryRouter = express.Router();

categoryRouter.use(authMiddleware)

categoryRouter.route("/").post(createCategory).get(fetchCategories);
categoryRouter.route("/:id").get(fetchCategory).put(updateCategory).delete(deleteCateory);

export default categoryRouter;
