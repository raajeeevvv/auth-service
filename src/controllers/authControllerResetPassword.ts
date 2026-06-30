import { Response, Request } from "express";
import { resetPasswordSchema } from "../validator/authValidator";
import crypto from "crypto";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { getSaltRound } from "../config/env";

export async function authControllerResetPassword(req: Request, res: Response) {
  try {
    const parsedResult = resetPasswordSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsedResult.error.issues });
    }
    const { token, newPassword } = parsedResult.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() }, // this is imp for the token expiry "gt = greate than" eg:10:12 > 10:10 true hence not expired yet
    });
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, getSaltRound());

    //db calls
    user.password = hashedPassword;
    user.resetPasswordTokenHash = undefined;
    user.refreshToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: "Password has been reset !!",
    });
  } catch (error) {
    console.log("Error in authControllerResetPassword", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
