import { User } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { generateHashedToken, generateToken } from "../utils/token";

export async function sendVerificationEmail(user: User) {
  const rawToken = generateToken(); // this will be shared to the email
  const hashedToken = generateHashedToken(rawToken); // this will be stored in db to authenticate

  // generate the email link
  const link = `http://localhost:5173/verify-email?token=${rawToken}`;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyEmailTokenHash: hashedToken,
      verifyEmailExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  //TODO: send link to user email
  console.log("email Link is", link);
}
