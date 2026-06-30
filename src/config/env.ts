export function getJwtSecret() {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
  }
  return JWT_SECRET;
}
export function getJwtSecretRefreshToken() {
  const JWT_SECRET_REFRESH_TOKEN = process.env.JWT_SECRET_REFRESH_TOKEN;
  if (!JWT_SECRET_REFRESH_TOKEN) {
    throw new Error("JWT_SECRET_REFRESH_TOKEN is not defined in .env");
  }
  return JWT_SECRET_REFRESH_TOKEN;
}

export function getSaltRound() {
  const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
  if (!SALT_ROUNDS) {
    throw new Error("SALT_ROUNDS is not defined in .env");
  }
  return SALT_ROUNDS;
}
