import request from "supertest";
import {
  describe,
  it,
  expect,
  afterEach,
  afterAll,
  jest,
} from "@jest/globals";
import app from "../app";
import { prisma } from "../lib/prisma";
import { createDummyUser } from "./helper/createDummyUser";
import { generateHashedToken } from "../utils/token";
import { comparePassword } from "../utils/password";

jest.mock("otplib", () => ({
  authenticator: {
    verify: jest.fn(),
    generate: jest.fn(),
  },
}));

afterEach(async () => {
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Reset Password", () => {
  it("should return 400 for an invalid token", async () => {
    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "this-is-token", newPassword: "thisispassword" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or expired token");
  });

  it("should return 400 for an expired token", async () => {
    const rawToken = "expired-token";
    const tokenHash = generateHashedToken(rawToken);
    const user = await createDummyUser({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: new Date(Date.now() - 1000), // 1 second in past
    });
    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, newPassword: "newPassword123" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or expired token");
  });

  it("should return 400 when reusing a token that was already used", async () => {
    const rawToken = "expired-token";
    const tokenHash = generateHashedToken(rawToken);
    const user = await createDummyUser({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
    });
    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, newPassword: "newPassword1" });
    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, newPassword: "newPassword2" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or expired token");
  });

  it("should return 200 and reset the password for a valid token", async () => {
    const rawToken = "valid-test-token";
    const tokenHash = generateHashedToken(rawToken);
    const user = await createDummyUser({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
    });
    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, newPassword: "newPassword1" });
    expect(response.status).toBe(200);

    const userFromDb = await prisma.user.findUnique({ where: { id: user.id } });
    const isMatch = await comparePassword(
      "newPassword1",
      userFromDb!.password!,
    );
    expect(isMatch).toBe(true);
    expect(userFromDb?.resetPasswordTokenHash).toBeNull();
  });
});
