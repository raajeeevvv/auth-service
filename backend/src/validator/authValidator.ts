import { z } from "zod";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Minimun length requires is 8"),
});

type SignupInput = z.infer<typeof signupSchema>;

const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

type LoginInput = z.infer<typeof loginSchema>;

const forgotPasswordSchema = z.object({
  email: z.email(),
});

type forgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type resetPasswordInput = z.infer<typeof resetPasswordSchema>;

const sendVerificationSchema = z.object({ email: z.email() });
const verifyEmailSchema = z.object({ token: z.string() });
const twoFactorVerifyOtpSchema = z.object({
  otp: z.string().min(1, "OTP is required"),
});

export {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendVerificationSchema,
  verifyEmailSchema,
  twoFactorVerifyOtpSchema,
};
export type {
  SignupInput,
  LoginInput,
  forgotPasswordInput,
  resetPasswordInput,
};
