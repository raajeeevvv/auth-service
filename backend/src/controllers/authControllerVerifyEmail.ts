import { Request, Response } from "express";
import { verifyEmailSchema } from "../validator/authValidator";
import { prisma } from "../lib/prisma";
import { generateHashedToken } from "../utils/token";

export async function authControllerVerifyEmail(req: Request, res: Response) {
  try {
    const parsedResult = verifyEmailSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsedResult.error.issues });
    }
    const { token } = parsedResult.data;
    //hash the token
    const tokenHash = generateHashedToken(token);
    const user = await prisma.user.findFirst({
      where: {
        verifyEmailTokenHash: tokenHash,
        verifyEmailExpires: { gt: new Date() },
      },
    });
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyEmailExpires: null,
        verifyEmailTokenHash: null,
      },
    });
    return res.status(200).json({
      message: "Email Verified Successfully",
    });
  } catch (error) {
    console.log("Error in authControllerVerifyEmail", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
