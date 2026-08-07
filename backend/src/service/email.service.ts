import dotenv from "dotenv";
dotenv.config();
import { Resend } from "resend";
import { verificationEmailTemplate } from "../templates/verificationEmail";
import { resetPasswordEmailTemplate } from "../templates/resetPasswordEmail";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export async function sendVerificationEmail(email: string, link: string) {
  const html = verificationEmailTemplate(link);
  await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: email,
    subject: "Verify your email",
    html,
  });
}

export async function sendResetEmail(email: string, link: string) {
  const html = resetPasswordEmailTemplate(link);
  await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: email,
    subject: "Reset your password",
    html,
  });
}
