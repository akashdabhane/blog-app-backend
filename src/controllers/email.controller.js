import expressAsyncHandler from "express-async-handler";
import sgMail from "@sendgrid/mail";
import Filter from "bad-words";
import { EmailMsg } from "../models/emailMessage.model.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const sendEmailMsg = expressAsyncHandler(async (req, res) => {
    const { to, subject, message } = req.body;
    //get the message
    const emailMessage = subject + " " + message;
    //prevent profanity/bad words
    const filter = new Filter();

    const isProfane = filter.isProfane(emailMessage);

    if (isProfane)
        throw new ApiError(400, "Email sent failed, because it contains profane words.");
    try {
        //buld up msg
        const msg = {
            to,
            subject,
            text: message,
            from: "founderofsc@gmail.com",
        };
        //send msg
        await sgMail.send(msg);
        //save to our db
        await EmailMsg.create({
            sentBy: req?.user?._id,
            from: req?.user?.email,
            to,
            message,
            subject,
        });

        return res
            .status(201)
            .json(
                new ApiResponse(201, {}, "Email sent successfully.")
            )
    } catch (error) {
        throw new ApiResponse(500, error.message || "Failed to send email.");
    }
});

export { sendEmailMsg };
