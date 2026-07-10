import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const verify = verifyAccessToken(token);

    req.user = verify; // why no check after verify ? becasuer it throw error and it will caught by try catch

    next();
  } catch (error) {
    console.error("Error in authMiddleware", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
