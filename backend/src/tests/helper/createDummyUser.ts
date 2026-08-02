import { prisma } from "../../lib/prisma";
import { User } from "../../generated/prisma/client";
import { hashPassword } from "../../utils/password";

type DummyUserOverrides = Partial<User>;

export async function createDummyUser(overrides: DummyUserOverrides = {}) {
  const plainPassword = overrides.password ?? "thisispassword";
  const hashedPassword = await hashPassword(plainPassword);
  const user = await prisma.user.create({
    data: {
      email: "test@test.com",
      isVerified: true,
      ...overrides,
      password: hashedPassword,
    },
  });
  return user;
}