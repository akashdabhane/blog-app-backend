import expressAsyncHandler from "express-async-handler";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"


//create
const createCategory = expressAsyncHandler(async (req, res) => {
    try {
        const category = await Category.create({
            user: req.user._id,
            title: req.body.title,
        });

        return res
            .status(201)
            .json(
                new ApiResponse(201, category, "New category is created!")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "failed to created new category");
    }
});

//fetch all
const fetchCategories = expressAsyncHandler(async (req, res) => {
    try {
        const categories = await Category.find({})
            .populate("user")
            .sort("-createdAt");

        return res
            .status(200)
            .json(
                new ApiResponse(200, categories, "All categories fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "failed to fetch category");
    }
});

//fetch a single category
const fetchCategory = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id)
            .populate("user")
            .sort("-createdAt");

        return res
            .status(200)
            .json(
                new ApiResponse(200, category, "Category fetched successfully")
            )
    } catch (error) {
        throw new ApiError(404, error.message || "Category not found");
    }
});

//update
const updateCategory = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findByIdAndUpdate(
            id,
            {
                title: req?.body?.title,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        return res
            .status(200)
            .json(
                new ApiResponse(200, category, "Category updated successfully")
            )
    } catch (error) {
        throw new ApiError(400, error.message || "Failed to update category");
    }
});

//delete category
const deleteCateory = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findByIdAndDelete(id);

        return res
            .status(200)
            .json(
                new ApiResponse(200, category, "Category deleted successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to delete category");
    }
});

export {
    createCategory,
    updateCategory,
    fetchCategories,
    fetchCategory,
    deleteCateory,
};
