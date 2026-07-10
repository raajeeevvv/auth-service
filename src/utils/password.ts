import bcrypt from "bcryptjs";
import { getSaltRound } from "../config/env";

export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, getSaltRound());
  return hash;
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
}
