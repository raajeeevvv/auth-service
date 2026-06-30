import { Request, Response } from "express";
import { sendVerificationSchema } from "../validator/authValidator";
import crypto from "crypto";
import User from "../models/User";

export async function authControllerSendVerification(
  req: Request,
  res: Response,
) {
  try {
    const parsedResult = sendVerificationSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsedResult.error.issues });
    } 

    const { email } = parsedResult.data;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message: "If that email exists, a verify link has been sent.",
      });
    }
    if (user.isVerified) {
      return res
        .status(200)
        .json({
          message: "If that email exists, a verify link has been sent.",
        });
    }

    const rawToken = crypto.randomBytes(32).toString("hex"); // this will be shared to the email
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex"); // this will be stored in db to authenticate

    // generate the email link
    const link = `http://localhost:5173/verify-email?token=${rawToken}`;
    console.log("email Link is", link);
    user.verifyEmailTokenHash = tokenHash;
    user.verifyEmailExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return res.status(200).json({
      message: "If that email exists, a verify link has been sent.",
    });
  } catch (error) {
    console.error("Error in authControllerSendVerification", error);
    return res.status(500).json({
      message: "Internall Server Error",
    });
  }
}
