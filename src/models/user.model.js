import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto"
import jwt from "jsonwebtoken"

//create schema
const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "First name is required"],
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
        },
        profilePhoto: {
            type: String,
            default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
        },
        email: {
            type: String,
            required: [true, "Email is required"],
        },
        bio: {
            type: String,
        },
        password: {
            type: String,
            required: [true, "Hei buddy Password is required"],
        },
        postCount: {
            type: Number,
            default: 0,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ["Admin", "Guest", "Blogger"],
        },
        isFollowing: {
            type: Boolean,
            default: false,
        },
        isUnFollowing: {
            type: Boolean,
            default: false,
        },
        isAccountVerified: {
            type: Boolean,
            default: false
        },
        accountVerificationToken: String,
        accountVerificationTokenExpires: Date,

        viewedBy: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },

        followers: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },
        following: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },
        passwordChangeAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,

        active: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        }
    },
    {
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
        timestamps: true,
    }
);

//virtual method to populate created post
userSchema.virtual("posts", {
    ref: "Post",
    foreignField: "user",
    localField: "_id",
});

//Hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

//match password
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// generate access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            phone: this.phone
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

//Verify account
userSchema.methods.createAccountVerificationToken = async function () {
    //create a token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    this.accountVerificationToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
    this.accountVerificationTokenExpires = Date.now() + 30 * 60 * 1000; //10 minutes
    return verificationToken;
};

//Password reset/forget
userSchema.methods.createPasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.passwordResetExpires = Date.now() + 30 * 60 * 1000; //10 minutes
    return resetToken;
};

//Compile schema into model
const User = mongoose.model("User", userSchema);

export { User }
