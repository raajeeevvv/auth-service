import { Request, Response, NextFunction } from "express";
import { AuthPayload } from "../types";

// factory function "requireRole"
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthPayload;
      if (!user || !user) {
        return res.status(401).json({
          message: "Forbidden",
        });
      }
      if (!roles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden — insufficient permissions" });
      }
      next();
    } catch (error) {
      console.log("Error in requireRole middleware", error);
      return res.status(500).json({
        message: "Unexpected Error, Try Again",
      });
    }
  };
}
