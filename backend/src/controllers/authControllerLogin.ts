import { Request, Response } from "express";
import User from "../models/User";
import { loginSchema } from "../validator/authValidator";
import { comparePassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { DUMMY_PASSWORD_HASH } from "../config/dummyHash";
import { AuthPayload } from "../types";

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
    const user = await User.findOne({ email });

    // did this to prevent timing attacks 
    const hashToCompareAgainst =
      user && user.provider === "local" && user.password
        ? user.password
        : DUMMY_PASSWORD_HASH;

    const isPasswordCorrect = await comparePassword(
      password,
      hashToCompareAgainst,
    );

    if (!isPasswordCorrect) {
      if (user && user.provider === "local" && user.password) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
          user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        await user.save();
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const authenticatedUser = user as AuthPayload;

    if (!authenticatedUser.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in" });
    }

    const isLocked = authenticatedUser.lockUntil;
    if (isLocked && isLocked > new Date()) {
      return res.status(403).json({
        message:
          "Account is locked due to multiple failed login attempts. Please try again later.",
      });
    }

    const payload = {
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      id: authenticatedUser.id,
    };

    if (authenticatedUser.twoFactorEnabled) {
      const tempToken = generateAccessToken(
        { ...payload, requiresTwoFactor: true },
        "5m",
      );
      res.cookie("tempToken", tempToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
        path: "/",
        maxAge: 5 * 60 * 1000,
      });
      return res.status(200).json({ message: "Two Factor Reqired" });
    }

    const token = generateAccessToken(payload, "15m");
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 15 * 60 * 1000,
      path: "/",
    });

    const refreshToken = generateRefreshToken(payload, "7d");
    authenticatedUser.failedLoginAttempts = 0;
    authenticatedUser.lockUntil = undefined;
    authenticatedUser.refreshToken = refreshToken;
    await authenticatedUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
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
