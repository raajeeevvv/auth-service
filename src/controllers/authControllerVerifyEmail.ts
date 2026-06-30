import { Request, Response } from "express";
import { verifyEmailSchema } from "../validator/authValidator";
import crypto from "crypto";
import User from "../models/User";

export async function authControllerVerifyEmail(req: Request, res: Response) {
  try {
    const parsedResult = verifyEmailSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsedResult.error.issues });
    }
    const { token } = parsedResult.data;
    //hash the token
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verifyEmailTokenHash: tokenHash,
      verifyEmailExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    user.isVerified = true;
    user.verifyEmailExpires = undefined;
    user.verifyEmailTokenHash = undefined;
    await user.save();

    return res.status(200).json({
      message: "Email Verified Successfully",
    });
  } catch (error) {
    console.log("Error in authControllerVerifyEmail", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
