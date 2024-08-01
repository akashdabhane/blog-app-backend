import expressAsyncHandler from "express-async-handler"
import fs from "fs"
import crypto from "crypto"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { generateAccessAndRefreshTokens } from "../utils/generateAccessAndRefreshToken.js"
import { validateMongodbId } from "../utils/validateMongodbID.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
// import sgMail from "@sendgrid/mail"

// sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

// register user
const userRegister = expressAsyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if ([firstName, lastName, email, password].some(field =>
        field?.trim() === "" || field?.trim() === undefined
    )) {
        throw new ApiError(400, "All fields are required");
    }

    const userExists = await User.findOne({ email: email });
    if (userExists) throw new ApiError(404, "User already exists");

    try {
        //create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password
        });

        return res
            .status(201)
            .json(
                new ApiResponse(201, user, "User registered successfully!")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to register user")
    }
});

// login user
const loginUser = expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if ([email, password].some(field =>
        field.trim === "" || field.trim === undefined
    )) {
        throw new ApiError(400, "email and password required")
    }

    const userFound = await User.findOne({ email });

    //Check if password is match
    if (userFound && (await userFound.isPasswordMatched(password))) {
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userFound._id)
        
        const loggedInUser = await User.findById(userFound?._id).select("-password -token")

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully",)
            )
    } else {
        throw new ApiError(401, "Invalid Login Credentials");
    }
});

// get all users
const fetchUsers = expressAsyncHandler(async (req, res) => {
    console.log(req.headers);
    try {
        const users = await User.find({});
        return res
            .status(200)
            .json(
                new ApiResponse(200, users, "all users fetched!")
            )
    } catch (error) {
        throw new ApiError(500, "failed to fetch users")
    }
});

// delete user
const deleteUsers = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    //check if user id is valid
    validateMongodbId(id);
    try {
        const deletedUser = await User.findByIdAndDelete(id);
        
        return res
            .status(200)
            .json(
                new ApiResponse(200, { user: deletedUser }, "User deleted successfully")
            )
    } catch (error) {
        throw new ApiError(500, "failed to delete user")
    }
});

// user details
const fetchUserDetails = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    //check if user id is valid
    validateMongodbId(id);
    try {
        const user = await User.findById(id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, user, "user detailed fetched")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to fetch user")
    }
});

// user profile
const userProfile = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try {
        const myProfile = await User.findById(id).populate("posts");
        
        if (!myProfile) throw new ApiError(404, "user not found with id", id);

        return res
            .status(200)
            .json(
                new ApiResponse(200, myProfile, "user profile fetched")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "failed to retrieve user information");
    }
});

// update user profile
const updateUser = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    const updatedUser = await User.findByIdAndUpdate(
        _id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!updatedUser) throw new ApiError(404, "User not found and failed to update");

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "user updated successfully")
        )
});

// update user password
const updateUserPassword = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { newPassword } = req.body;
    validateMongodbId(_id);

    //Find the user by _id
    const user = await User.findById(_id);

    if (newPassword) {
        user.password = newPassword;
        const updatedUser = await user.save();

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedUser, "user updated successfully")
            )
    } else {
        throw new ApiError(400, "new password is required")
    }
});

// following
const followingUser = expressAsyncHandler(async (req, res) => {
    //1.Find the user you want to follow and update it's followers field
    //2. Update the login user following field
    const { followId } = req.body;
    const loginUserId = req.user._id;
    
    if(!followId) throw new ApiError(400, "follow Id is required")
    
    const targetUser = await User.findById(followId);

    if(!targetUser) throw new ApiError(404, "target user not found!");

    const alreadyFollowing = targetUser?.followers?.find(
        user => user.equals(loginUserId)
    );
    
    if (alreadyFollowing) throw new ApiError(400, "You have already followed this user");

    //1. Find the user you want to follow and update it's followers field
    await User.findByIdAndUpdate(
        followId,
        {
            $push: { followers: loginUserId },
            isFollowing: true,
        },
        { new: true }
    );

    //2. Update the login user following field
    await User.findByIdAndUpdate(
        loginUserId,
        {
            $push: { following: followId },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "You have successfully followed this user")
        )
});

//unfollow user
const unfollowUser = expressAsyncHandler(async (req, res) => {
    const { unFollowId } = req.body;
    const loginUserId = req.user._id;

    if(!unFollowId) throw new ApiError(400, "unfollowId is required!")

    await User.findByIdAndUpdate(
        unFollowId,
        {
            $pull: { followers: loginUserId },
            isFollowing: false,
        },
        { new: true }
    );

    await User.findByIdAndUpdate(
        loginUserId,
        {
            $pull: { following: unFollowId },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "You have successfully unfollowed this user")
        )
});

// block user
const blockUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    const user = await User.findByIdAndUpdate(
        id,
        {
            isBlocked: true,
        },
        { new: true }
    );

    if(!user) throw new ApiError(404, "User not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "blocked successful")
        )
});

// unblock user
const unBlockUser = expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    const user = await User.findByIdAndUpdate(
        id,
        {
            isBlocked: false,
        },
        { new: true }
    );

    if(!user) throw new ApiError(404, "User not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "unblocked successful")
        )
});

// Generate Email verification token
const generateVerificationToken = expressAsyncHandler(async (req, res) => {
    const loginUserId = req.user._id;

    const user = await User.findById(loginUserId);

    try {
        //Generate token
        const verificationToken = await user.createAccountVerificationToken();
        //save the user
        await user.save();
        console.log(verificationToken);
        //build your message

        const resetURL = `If you were requested to verify your account, verify now within 10 minutes, otherwise ignore this message <a href="http://localhost:3000/verify-account/${verificationToken}">Click to verify your account</a>`;
        const msg = {
            to: "ajaybade291@gmail.com",
            from: "founderofsc@gmail.com",
            subject: "Verify your account",
            html: resetURL,
        };

        await sgMail.send(msg);

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "email verificaiton sent successfully")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to send verification email");
    }
});

//Account verification
const accountVerification = expressAsyncHandler(async (req, res) => {
    const { token } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    //find this user by token
    const userFound = await User.findOne({
        accountVerificationToken: hashedToken,
        accountVerificationTokenExpires: { $gt: new Date() },
    });
    if (!userFound) throw new Error("Token expired, try again later");
    //update the proprt to true
    userFound.isAccountVerified = true;
    userFound.accountVerificationToken = undefined;
    userFound.accountVerificationTokenExpires = undefined;
    await userFound.save();
    res.json(userFound);
});

//Forget token generator
const forgetPasswordToken = expressAsyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User Not Found");

    try {
        //Create token
        const token = await user.createPasswordResetToken();
        console.log(token);
        await user.save();

        //build your message
        const resetURL = `If you were requested to reset your password, reset now within 10 minutes, otherwise ignore this message <a href="http://localhost:3000/reset-password/${token}">Click to Reset</a>`;
        const msg = {
            to: email,
            from: process.env.MY_EMAIL,
            subject: "Reset Password",
            html: resetURL,
        };

        await sgMail.send(msg);
        res.json({
            msg: `A verification message is successfully sent to ${user?.email}. Reset now within 10 minutes, ${resetURL}`,
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "reset password email sent to email")
            )
    } catch (error) {
        throw new ApiError(500, error.message || "Failed to send reset password email");
    }
});

//Password reset
const passwordReset = expressAsyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    //find this user by token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new ApiError(400, "Token Expired, try again later");

    //Update/change the password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password reset successfully")
        )
});

//Profile photo upload
const profilePhotoUpload = expressAsyncHandler(async (req, res) => {
    const { _id } = req.user;

    //1. Get the oath to img
    const localFilePath = `public/images/profile/${req.file.filename}`; 
    //2.Upload to cloudinary
    const imgUploaded = await uploadOnCloudinary(localFilePath);    

    const foundUser = await User.findByIdAndUpdate(
        _id,
        {
            profilePhoto: imgUploaded.secure_url,
        },
        { new: true }
    );

    if (!foundUser) throw new ApiError(500, "failed to upload profile image");

    //remove the saved img
    // fs.unlinkSync(localFilePath);

    return res
        .status(200)
        .json(
            new ApiResponse(200, foundUser, "profile photo updated successfully")
        )
});

export {
    profilePhotoUpload,
    forgetPasswordToken,
    generateVerificationToken,
    userRegister,
    loginUser,
    fetchUsers,
    deleteUsers,
    fetchUserDetails,
    userProfile,
    updateUser,
    updateUserPassword,
    followingUser,
    unfollowUser,
    blockUser,
    unBlockUser,
    accountVerification,
    passwordReset,
}
