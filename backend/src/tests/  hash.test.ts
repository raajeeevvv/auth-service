import { describe, expect, it } from "@jest/globals";
import { comparePassword, hashPassword } from "../utils/password";
import { generateHashedToken, generateToken } from "../utils/token";

describe("Password Hashing", () => {
  it("should return true when comparing correct password to hash", async () => {
    const hash = await hashPassword("mypas1");
    const result = await comparePassword("mypas1", hash);
    expect(result).toBe(true);
  });

  it("should return false when comparing wrong password to hash", async () => {
    const hash = await hashPassword("mypas1");
    const result = await comparePassword("wrongpass1", hash);
    expect(result).toBe(false);
  });
});

describe("token SHA verification", () => {
  it("should return true when comparing correct hashed token", async () => {
    const rawToken = generateToken();
    const hashedToken = generateHashedToken(rawToken);
    const reHasedToken = generateHashedToken(rawToken);
    expect(hashedToken === reHasedToken).toBe(true);
  });

  it("should return false when comparing wrong hashed token", async () => {
    const rawToken = generateToken();
    const rawToken2 = generateToken();
    const hashedToken = generateHashedToken(rawToken);
    const reHasedToken = generateHashedToken(rawToken2);
    expect(hashedToken === reHasedToken).toBe(false);
  });
});
