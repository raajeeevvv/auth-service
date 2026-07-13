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

describe("Send Verification Email", () => {
  it("should return 200 with generic-message for non-existing email", async () => {
    const response = await request(app)
      .post("/api/auth/send-verification")
      .send({ email: "notanemail@mail.com" });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "If that email exists, a verify link has been sent.",
    );
  });
  it("should return 200 for already verified email, without generating a token", async () => {
    const user = await createDummyUser({ isVerified: true });
    const response = await request(app)
      .post("/api/auth/send-verification")
      .send({ email: user.email });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "If that email exists, a verify link has been sent.",
    );

    const userFromDb = await User.findById(user.id);
    expect(userFromDb?.verifyEmailTokenHash).toBeUndefined();
  });

  it("should return 400 when invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/send-verification")
      .send({ email: "invalid-mail" });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Invalid input/);
  });

  it("should return 200 and generic message for unverified email", async () => {
    const user = await createDummyUser({
      isVerified: false,
    });

    const response = await request(app)
      .post("/api/auth/send-verification")
      .send({ email: user.email });

    expect(response.status).toBe(200);

    const userFromDb = await User.findById(user.id);
    expect(userFromDb?.verifyEmailTokenHash).toBeDefined();
    expect(userFromDb?.verifyEmailExpires).toBeDefined();
  });
});
