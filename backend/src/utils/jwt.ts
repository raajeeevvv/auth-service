import jwt, { SignOptions } from "jsonwebtoken";
import { getJwtSecret, getJwtSecretRefreshToken } from "../config/env";
import { AuthPayload } from "../types";

export function generateAccessToken(
  payload: AuthPayload,
  expiresIn: SignOptions["expiresIn"]
): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function generateRefreshToken(
  payload: AuthPayload,
  expiresIn: SignOptions["expiresIn"]
): string {
  return jwt.sign(payload, getJwtSecretRefreshToken(), { expiresIn });
}

export function verifyAccessToken(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, getJwtSecret());
}

export function verifyRefreshToken(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, getJwtSecretRefreshToken());
}