import { Request, Response } from "express";
import User from "../models/User";
import { signupSchema } from "../validator/authValidator";
import { hashPassword } from "../utils/password";
import { sendVerificationEmail } from "../service/verificationService";

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

    const isUserExist = await User.findOne({
      email: email,
    });
    if (isUserExist) {
      return res.status(409).json({
        message: "User already exist try with other email",
      });
    }
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email: email,
      password: hashedPassword,
      provider: "local",
    });

    await sendVerificationEmail(user);
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
