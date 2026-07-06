import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { loginSchema } from "../validator/authValidator";
import jwt from "jsonwebtoken";
import { getJwtSecret, getJwtSecretRefreshToken } from "../config/env";

export async function authControllerLogin(req: Request, res: Response) {
  try {
    const parsedUser = loginSchema.safeParse(req.body);
    if (!parsedUser.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsedUser.error.issues,
      });
    }
    const { email, password } = parsedUser.data;

    const isUserExist = await User.findOne({
      email: email,
    });

    if (isUserExist == null) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    if (!isUserExist.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    const isLocked = isUserExist.lockUntil;
    if (isLocked && isLocked > new Date()) {
      return res.status(403).json({
        message:
          "Account is locked due to multiple failed login attempts. Please try again later.",
      });
    }
    if (
      isUserExist.provider !== "local" ||
      isUserExist.password === undefined
    ) {
      return res.status(400).json({
        message: "This account uses social login. Please sign in with Google.",
      });
    }
    const isPasswordCorrect = await bcrypt.compare(
      password,
      isUserExist.password,
    );

    if (!isPasswordCorrect) {
      isUserExist.failedLoginAttempts =
        (isUserExist.failedLoginAttempts || 0) + 1;
      if (isUserExist.failedLoginAttempts >= 5) {
        isUserExist.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await isUserExist.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // making jwt token for auth of everyother request user send to backend

    const token = jwt.sign(
      { email,id: isUserExist.id, role: isUserExist.role },
      getJwtSecret(),
      {
        expiresIn: "15m",
      },
    );

    // setting token in the cookie so that i automatically being send as the user request the backend
    res.cookie("token", token, {
      httpOnly: true, // this "true" means that the JS/DOM cannot access it throuf document.cookie to prevent XSS
      sameSite: "strict", // to prevent CSRF attack
      secure: false, // make it true during production
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    //refresh token
    const refreshToken = jwt.sign(
      { email, id: isUserExist.id, role: isUserExist.role },
      getJwtSecretRefreshToken(),
      {
        expiresIn: "7d",
      },
    );
    isUserExist.failedLoginAttempts = 0;
    isUserExist.lockUntil = undefined;
    isUserExist.refreshToken = refreshToken;
    await isUserExist.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false, // change in production to true
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({ message: "User logged in successfully" });
  } catch (error) {
    console.error("Error in authControllerLogin", error);
    return res.status(500).json({
      message: "Unexpected Error, Try Again",
    });
  }
}
