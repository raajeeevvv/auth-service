import { describe, expect, it } from "@jest/globals";
import { generateAccessToken, verifyAccessToken } from "../utils/jwt";

describe("JWT tests", () => {
  it("should verify the token it generated", () => {
    const payload = {
      email: "jhondoe@gmail.com",
      id: "2323kkk34343",
      role: "user",
    };
    const token = generateAccessToken(payload, "15m");
    const decode = verifyAccessToken(token);
    expect(decode).toMatchObject(payload);
  });

  it("should throw when verifying a tampered token", () => {
    const payload = {
      email: "jhondoe@gmail.com",
      id: "2323kkk34343",
      role: "user",
    };
    const token = generateAccessToken(payload, "15m");
    const tampered = token.slice(0, -1) + (token.slice(-1) === "a" ? "b" : "a");

    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("should throw when verifying an expired token", () => {
    const payload = {
      email: "jhondoe@gmail.com",
      id: "2323kkk34343",
      role: "user",
    };
    const token = generateAccessToken(payload, "-1s");
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
