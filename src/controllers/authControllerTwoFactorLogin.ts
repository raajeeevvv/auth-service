import { Request, Response } from "express";
import { verify } from "otplib";
import User from "../models/User";
import { generateAccessToken, generateRefreshToken, verifyAccessToken} from "../utils/jwt";

export async function authControllerTwoFactorLogin(
  req: Request,
  res: Response,
) {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }
    const tempToken = req.cookies.tempToken;
    if (!tempToken) {
      return res.status(400).json({
        message: "Token not found, Retry login again",
      });
    }
    const jwtVerify = verifyAccessToken(tempToken);

    if (typeof jwtVerify === "string") {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    if (!jwtVerify.requiresTwoFactor) {
      return res.status(401).json({ message: "Invalid token type" });
    }
    const user = await User.findById(jwtVerify.id);
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    if (!user.twoFactorSecret) {
      return res.status(400).json({
        message: "2FA setup not initiated — call /twofactor/setup first",
      });
    }
    const twoFactorVerify = await verify({
      secret: user.twoFactorSecret,
      token: otp,
    });

    if (!twoFactorVerify.valid) {
      return res.status(401).json({
        message: "invalid OTP ",
      });
    }

    const payload = { email: user.email, id: user.id, role: user.role };
    const token = generateAccessToken(payload, "15m");

    // setting token in the cookie so that i automatically being send as the user request the backend
    res.cookie("token", token, {
      httpOnly: true, // this "true" means that the JS/DOM cannot access it throuf document.cookie to prevent XSS
      sameSite: "strict", // to prevent CSRF attack
      secure: false, // make it true during production
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    //refresh token
    const refreshToken = generateRefreshToken(payload, "7d");
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false, // change in production to true
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.clearCookie("tempToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: false, // change when in production,
      path: "/",
    });

    return res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
