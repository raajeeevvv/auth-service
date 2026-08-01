import { Response, Request } from "express";
import { resetPasswordSchema } from "../validator/authValidator";
import { prisma } from "../lib/prisma";
import { generateHashedToken } from "../utils/token";
import { hashPassword } from "../utils/password";

export async function authControllerResetPassword(req: Request, res: Response) {
  try {
    const parsedResult = resetPasswordSchema.safeParse(req.body);
    if (!parsedResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid input", errors: parsedResult.error.issues });
    }
    const { token, newPassword } = parsedResult.data;
    const tokenHash = generateHashedToken(token);

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: { gt: new Date() }, // this is imp for the token expiry "gt = greate than" eg:10:12 > 10:10 true hence not expired yet
      },
    });
    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
      },
    });
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    return res.status(200).json({
      message: "Password has been reset !!",
    });
  } catch (error) {
    console.log("Error in authControllerResetPassword", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
