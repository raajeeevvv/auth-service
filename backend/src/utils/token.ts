import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateHashedToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
