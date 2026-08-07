import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { signupSchema } from "../validator/authValidator";
import { hashPassword } from "../utils/password";
import { createVerificationToken } from "../service/verificationService";
import { emailQueue } from "../queue/email.queue";

export async function authControllerSignup(req: Request, res: Response) {
  try {
    const parsedUser = signupSchema.safeParse(req.body);
    if (!parsedUser.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsedUser.error.issues,
      });
    }
    const { email, password } = parsedUser.data;
    const isUserExist = await prisma.user.findUnique({
      where: { email },
    });
    if (isUserExist) {
      return res.status(409).json({
        message: "User already exist try with other email",
      });
    }
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const rawToken = await createVerificationToken(user);
    await emailQueue.add("send-verification-email", {
      email: user.email,
      link: `http://localhost:5173/verify-email?token=${rawToken}`,
    });

    return res.status(201).json({
      message: "Email verification link has been sended to you email",
    });
  } catch (error) {
    console.error("Error in authControllerSignup", error);
    return res.status(500).json({
      message: "Unexpected Error, Try Again",
    });
  }
}
