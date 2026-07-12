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

describe("Logout", () => {
  it("should return 200 with a valid token", async () => {
    const hashedPassword = await hashPassword("thisispassword");
    const user = await User.create({
      email: "test@test.com",
      password: hashedPassword,
      provider: "local",
      isVerified: true,
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisispassword" });

    const loginCookie = loginResponse.header["set-cookie"];

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", loginCookie);

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe("Logged out successfully");

    const cookies = logoutResponse.header["set-cookie"] as unknown as string[];

    const tokenCookie = cookies.find((c) => c.startsWith("token="));
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
    expect(tokenCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(refreshCookie).toMatch(/Expires=Thu, 01 Jan 1970/);

    const userFromDb = await User.findById(user.id);
    expect(userFromDb?.refreshToken).toBeUndefined();
  });
  it("should return 401 when logging out without a valid token", async () => {
    const response = await request(app).post("/api/auth/logout");
    expect(response.status).toBe(401);
  });
});
