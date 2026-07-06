import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import jwt from "jsonwebtoken";
import { getJwtSecret, getJwtSecretRefreshToken } from "../config/env";
import { AuthPayload } from "../types";

export async function authControllerGoogleCallback(
  req: Request,
  res: Response,
) {
  try {
    const user = req.user as AuthPayload;
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    const { email, role, id } = user;
    const token = jwt.sign({ email, id, role }, getJwtSecret(), {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
      { email, id, role },
      getJwtSecretRefreshToken(),
      {
        expiresIn: "7d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
      secure: false, // change in production to true
      path: "/",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false, // change in production to true
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    user.refreshToken = refreshToken;
    await user.save();
    return res.redirect("http://localhost:5173/dashboard");
  } catch (error) {
    console.error("Error in authControllerGoogleCallback", error);
    return res.status(500).json({
      message: "Unexpected Error, Try Again",
    });
  }
}
