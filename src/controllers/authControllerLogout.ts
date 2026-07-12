import { Response, Request } from "express";
import { AuthPayload } from "../types";
import User from "../models/User";

export async function authControllerLogout(req: Request, res: Response) {
  try {
    const { id } = req.user as AuthPayload;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.refreshToken = undefined;
    await user.save();

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in authControllerLogout", error);
    return res.status(500).json({ message: "Unexpected Error, Try Again" });
  }
}
