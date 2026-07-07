import { Request, Response } from "express";
import { AuthPayload } from "../types";
import User from "../models/User";
import { verify } from "otplib";

export async function authControllerTwoFactorVerify(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.user as AuthPayload;
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "OTP otp is required" });
    }
    const user = await User.findById(id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!user.twoFactorSecret) {
      return res.status(400).json({
        message: "2FA setup not initiated — call /twofactor/setup first",
      });
    }

    const result = await verify({
      secret: user.twoFactorSecret,
      token:otp,
    });
    if (!result.valid) {
      return res.status(401).json({
        message: "invalid OTP ",
      });
    }
    user.twoFactorEnabled = true;
    await user.save();
    return res.status(200).json({
      message: "Two Factor Successfull",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
