import { Response, Request } from "express";

export function authControllerLogout(req: Request, res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: false, // change when in production,
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: false, // change when in production,
    path: "/",
  });
  return res.status(200).json({ message: "Logged out successfully" });
}
