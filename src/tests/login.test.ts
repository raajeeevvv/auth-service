import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";
import app from "../app";
import User from "../models/User";
import { hashPassword } from "../utils/password";

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

describe("POST /signup", () => {
  it("should return status code 200 and add access & refress token to cookie", async () => {
    const hashedPassword = await hashPassword("thisispassword");
    await User.create({
      email: "test@test.com",
      password: hashedPassword,
      provider: "local",
      isVerified: true,
    });
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisispassword" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User logged in successfully");

    const cookies = response.header["set-cookie"] as unknown as string[];
    const accessTokenCookie = cookies.find((c: string) =>
      c.startsWith("token="),
    );
    const refreshTokenCookie = cookies.find((c: string) =>
      c.startsWith("refreshToken="),
    );

    expect(accessTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toBeDefined();
    expect(accessTokenCookie).toMatch(/HttpOnly/);
    expect(refreshTokenCookie).toMatch(/HttpOnly/);
  });

  it("should return 401 for wrong password", async () => {
    const hashedPassword = await hashPassword("thisispassword");
    await User.create({
      email: "test@test.com",
      password: hashedPassword,
      provider: "local",
      isVerified: true,
    });
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisiswrongpassword" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  it("should return the same response as wrong password for a non-existent email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "doesnotexist@test.com", password: "whatever123" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });
});
