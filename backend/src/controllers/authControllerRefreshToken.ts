import { Request, Response } from "express";
import User from "../models/User";
import { generateAccessToken, verifyRefreshToken } from "../utils/jwt";

export async function authControllerRefreshToken(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { id } = decoded;
    const user = await User.findById(id);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
    };
    const token = generateAccessToken(payload, "15m");
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error occured in authControllerRefreshToken",
    });
  }
}