import { Request, Response } from "express";
import User from "../models/User";
import { loginSchema } from "../validator/authValidator";
import { comparePassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

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

    const user = await User.findOne({
      email: email,
    });

    if (user == null) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    const isLocked = user.lockUntil;
    if (isLocked && isLocked > new Date()) {
      return res.status(403).json({
        message:
          "Account is locked due to multiple failed login attempts. Please try again later.",
      });
    }
    if (user.provider !== "local" || user.password === undefined) {
      return res.status(400).json({
        message: "This account uses social login. Please sign in with Google.",
      });
    }
    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // making jwt token for auth of everyother request user send to backend

    const payload = {
      email: user.email,
      role: user.role,
      id: user.id,
    };
    if (user.twoFactorEnabled) {
      const tempToken = generateAccessToken(
        {
          email: user.email,
          role: user.role,
          id: user.id,
          requiresTwoFactor: true,
        },
        "5m",
      );
      res.cookie("tempToken", tempToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false, //change in production
        path: "/",
        maxAge: 5 * 60 * 1000,
      });
      return res.status(200).json({
        message: "Two Factor Reqired",
      });
    }

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
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.refreshToken = refreshToken;
    await user.save();

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
