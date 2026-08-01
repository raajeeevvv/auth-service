import { Request, Response } from "express";
import { sendVerificationSchema } from "../validator/authValidator";
import { prisma } from "../lib/prisma";
import { sendVerificationEmail } from "../service/verificationService";

export async function authControllerSendVerification(
  req: Request,
  res: Response,
) {
  try {
    const parsedResult = sendVerificationSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsedResult.error.issues });
    }

    const { email } = parsedResult.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({
        message: "If that email exists, a verify link has been sent.",
      });
    }
    if (user.isVerified) {
      return res.status(200).json({
        message: "If that email exists, a verify link has been sent.",
      });
    }

    await sendVerificationEmail(user);

    return res.status(200).json({
      message: "If that email exists, a verify link has been sent.",
    });
  } catch (error) {
    console.error("Error in authControllerSendVerification", error);
    return res.status(500).json({
      message: "Internall Server Error",
    });
  }
}
