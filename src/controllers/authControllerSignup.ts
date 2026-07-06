import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { signupSchema } from "../validator/authValidator";
import { getSaltRound } from "../config/env";

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
    const hashedPassword = await bcrypt.hash(password, getSaltRound());

    const user = await User.create({
      email: email,
      password: hashedPassword,
      provider:'local'
    });

    return res.status(201).json({
      message: "user created successfully",
    });
  } catch (error) {
    console.error("Error in authControllerSignup", error);
    return res.status(500).json({
      message: "Unexpected Error, Try Again",
    });
  }
}
