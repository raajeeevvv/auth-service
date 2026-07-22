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

describe("Forgot Password", () => {
  it("should return 200 when non-existing email try to reset password", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "dummy@gmail.com" });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "If that email exists, a reset link has been sent.",
    );
  });
  it("should return 400 when malformed email is being send", async () => {
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "dummygmail.com" });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Invalid input/);
  });

  it("should return 200 and resetPasswordToken and resetPasswordExipre should be saved in DB", async () => {
    const user = await createDummyUser();
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: user.email });
    expect(response.status).toBe(200);

    const userFromDb = await User.findById(user.id);
    expect(userFromDb?.resetPasswordTokenHash).toBeDefined();
    expect(userFromDb?.resetPasswordExpires).toBeDefined();
  });
});
