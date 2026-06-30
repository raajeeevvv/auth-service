import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env";

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
    const verify = jwt.verify(token, getJwtSecret());
    
    req.user = verify;

    next();
  } catch (error) {
    console.error("Error in authMiddleware", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
