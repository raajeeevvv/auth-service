import request from "supertest";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  jest,
} from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../app";
import User from "../models/User";
import { createDummyUser } from "./helper/createDummyUser";
import { generateHashedToken } from "../utils/token";
import { comparePassword } from "../utils/password";

let mongoServer: MongoMemoryServer;

jest.mock("otplib", () => ({
  authenticator: {
    verify: jest.fn(),
    generate: jest.fn(),
  },
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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

    const userFromDb = await User.findById(user.id);
    const isMatch = await comparePassword(
      "newPassword1",
      userFromDb!.password!,
    );
    expect(isMatch).toBe(true);
    expect(userFromDb?.resetPasswordTokenHash).toBeUndefined();
  });
});
