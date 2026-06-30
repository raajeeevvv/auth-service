import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret, getJwtSecretRefreshToken } from "../config/env";
import User from "../models/User";

export async function authControllerRefreshToken(req: Request, res: Response) {
  try {
    const rt = req.cookies.refreshToken;
    if (!rt) {
      return res.status(401).json({ message: "No refresh token provided" });
    }
    const decoded = jwt.verify(rt, getJwtSecretRefreshToken());

    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const { id } = decoded;
    const user = await User.findById(id);
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    if (user.refreshToken !== rt) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    //genereate new token
    const token = jwt.sign({ email: user.email, id: user.id }, getJwtSecret(), {
      expiresIn: "15m",
    });
    res.cookie("token", token, {
      httpOnly: true, // this "true" means that the JS/DOM cannot access it throuf document.cookie to prevent XSS
      sameSite: "strict", // to prevent CSRF attack
      secure: false, // make it true during production
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
