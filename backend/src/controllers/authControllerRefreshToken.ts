import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { generateAccessToken, verifyRefreshToken } from "../utils/jwt";
import { generateHashedToken } from "../utils/token";

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
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const hashedIncomingToken = generateHashedToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashedIncomingToken },
    });
    if (
      !storedToken ||
      storedToken.userId !== user.id ||
      storedToken.expiresAt < new Date()
    ) {
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
