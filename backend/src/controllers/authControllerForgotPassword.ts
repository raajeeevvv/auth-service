import { Response, Request } from "express";
import { forgotPasswordSchema } from "../validator/authValidator";
import { prisma } from "../lib/prisma";
import { generateHashedToken, generateToken } from "../utils/token";

export async function authControllerForgotPassword(
  req: Request,
  res: Response,
) {
  try {
    const parsedResult = forgotPasswordSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsedResult.error.issues });
    }
    //find user with email
    const { email } = parsedResult.data;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(200).json({
        message: "If that email exists, a reset link has been sent.",
      });
    }
    const rawToken = generateToken(); // this will be shared to the email
    const tokenHash = generateHashedToken(rawToken); // this will be stored in db to authenticate
    // generate the email link
    const link = `http://localhost:5173/reset-password?token=${rawToken}`;
    console.log("email Link is", link);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return res.status(200).json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.log("Error in authControllerForgetPassword", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
