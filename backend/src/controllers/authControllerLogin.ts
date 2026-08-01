import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { loginSchema } from "../validator/authValidator";
import { comparePassword } from "../utils/password";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { generateHashedToken } from "../utils/token";
import { DUMMY_PASSWORD_HASH } from "../lib/dummyHash";

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
    const user = await prisma.user.findUnique({ where: { email } });

    // did this to prevent timing attacks
    const hashToCompareAgainst =
      user && user.password ? user.password : DUMMY_PASSWORD_HASH;
    const isPasswordCorrect = await comparePassword(
      password,
      hashToCompareAgainst,
    );

    if (!isPasswordCorrect) {
      if (user && user.password) {
        const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts,
            lockUntil:
              failedLoginAttempts >= 5
                ? new Date(Date.now() + 15 * 60 * 1000)
                : user.lockUntil,
          },
        });
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
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

    const payload = {
      email: user.email,
      role: user.role,
      id: user.id,
    };

    if (user.twoFactorEnabled) {
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
      return res.status(200).json({
        message: "Two Factor Reqired",
        is2faEnabled: user.twoFactorEnabled,
      });
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
    const hashedRefreshToken = generateHashedToken(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "User logged in successfully",
    });
  } catch (error) {
    console.error("Error in authControllerLogin", error);
    return res.status(500).json({
      message: "Unexpected Error, Try Again",
    });
  }
}
