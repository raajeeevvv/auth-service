import { Request, Response } from "express";
import { AuthPayload } from "../types";
import User from "../models/User";
import { verify } from "otplib";
import { twoFactorVerifyOtpSchema } from "../validator/authValidator";

export async function authControllerTwoFactorVerify(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.user as AuthPayload;
    const parsed = twoFactorVerifyOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message:"OTP is required" 
      });
    }

    const { otp } = parsed.data;
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
      token: otp,
    });
    console.log(result)
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
    console.error("error in authControllerTwoFactorVerify", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
