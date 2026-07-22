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

describe("Verify Email", () => {
  it("should return 400 for invalid token", async () => {
    const invalidToken = "this-token-is-invalid";
    const response = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: invalidToken });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or expired token");
  });

  it("should return 400 for expired token", async () => {
    const token = "this-is-token";
    const hashedToken = generateHashedToken(token);
    await createDummyUser({
      verifyEmailTokenHash: hashedToken,
      verifyEmailExpires: new Date(Date.now() - 1000),
    });

    const response = await request(app)
      .post("/api/auth/verify-email")
      .send({ token });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid or expired token");
  });

  it("should return 400 for reused token", async () => {
    const token = "this-is-token";
    const hashedToken = generateHashedToken(token);
    const user = await createDummyUser({
      verifyEmailTokenHash: hashedToken,
      verifyEmailExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    const firstResponse = await request(app)
      .post("/api/auth/verify-email")
      .send({ token });
    expect(firstResponse.status).toBe(200);

    const response = await request(app)
      .post("/api/auth/verify-email")
      .send({ token });

    expect(response.status).toBe(400);

    const userFromDb = await User.findById(user.id);
    expect(userFromDb?.verifyEmailTokenHash).toBeUndefined();
    expect(userFromDb?.verifyEmailExpires).toBeUndefined();
  });

  it("should return 200 for verification successfully", async () => {
    const token = "this-is-token";
    const hashedToken = generateHashedToken(token);
    const user = await createDummyUser({
      verifyEmailTokenHash: hashedToken,
      verifyEmailExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    const response = await request(app)
      .post("/api/auth/verify-email")
      .send({ token });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Email Verified Successfully");

    const userFromDb = await User.findById(user.id);
    expect(userFromDb?.isVerified).toBe(true);
    expect(userFromDb?.verifyEmailTokenHash).toBeUndefined();
    expect(userFromDb?.verifyEmailExpires).toBeUndefined();
    console.log(process.env.NODE_ENV);
  });
});
