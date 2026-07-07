import { Request, Response } from "express";
import { AuthPayload } from "../types";
import User from "../models/User";
import { generateSecret, generate, verify, generateURI } from "otplib";
import qrcode from "qrcode";

export async function authControllerTwoFactorSetup(req: Request, res: Response) {
  try {
    const { id, email } = req.user as AuthPayload;
    const user = await User.findById(id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.twoFactorEnabled) {
      return res.status(400).json({
        message: "2FA is already enabled",
      });
    }
    const secret = generateSecret();
    user.twoFactorSecret = secret;
    await user.save();
    const uri = generateURI({
      issuer: "auth-service",
      label: email,
      secret,
    });
    const qrCode = await qrcode.toDataURL(uri);

    res.status(200).json({
      message: "2FA setup initiated — scan QR code then verify",
      qrCodeDataUrl: qrCode, // ← rq → qr
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Inernal server error",
    });
  }
}
