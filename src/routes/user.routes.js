import express from "express"
import {
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
  generateVerificationToken,
  accountVerification,
  forgetPasswordToken,
  passwordReset,
  profilePhotoUpload,
} from "../controllers/user.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { photoUpload, profilePhotoResize } from "../middlewares/photoUpload.js"

const userRoutes = express.Router();

userRoutes.post("/register", userRegister);
userRoutes.post("/login", loginUser);
userRoutes.route("/upload-profilephoto")
  .put(authMiddleware, photoUpload.single("image"), profilePhotoResize, profilePhotoUpload);
userRoutes.get("/", authMiddleware, fetchUsers);

userRoutes.post("/forget-password-token", forgetPasswordToken);
userRoutes.put("/reset-password", passwordReset);
userRoutes.put("/update-password", authMiddleware, updateUserPassword);

userRoutes.put("/follow", authMiddleware, followingUser);
userRoutes.put("/unfollow", authMiddleware, unfollowUser);

userRoutes.post("/generate-verify-email-token", authMiddleware, generateVerificationToken);
userRoutes.put("/verify-account", authMiddleware, accountVerification);

userRoutes.put("/block-user/:id", authMiddleware, blockUser);
userRoutes.put("/unblock-user/:id", authMiddleware, unBlockUser);

userRoutes.get("/profile/:id", authMiddleware, userProfile);
userRoutes.route("/:id").delete(deleteUsers).get(fetchUserDetails).put(authMiddleware, updateUser);

export default userRoutes
