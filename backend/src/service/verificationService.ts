import { User } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { generateHashedToken, generateToken } from "../utils/token";

export async function createVerificationToken(user: User) {
  const rawToken = generateToken();
  const hashedToken = generateHashedToken(rawToken);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyEmailTokenHash: hashedToken,
      verifyEmailExpires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  return rawToken;
}