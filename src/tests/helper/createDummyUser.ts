import User, { IUser } from "../../models/User";
import { hashPassword } from "../../utils/password";

type DummyUserOverrides = Partial<IUser>;

export async function createDummyUser(overrides: DummyUserOverrides = {}) {
  const plainPassword = overrides.password ?? "thisispassword";
  const hashedPassword = await hashPassword(plainPassword);

  const user = await User.create({
    email: "test@test.com",
    provider: "local",
    isVerified: true,
    ...overrides,
    password: hashedPassword,
  });

  return user;
}