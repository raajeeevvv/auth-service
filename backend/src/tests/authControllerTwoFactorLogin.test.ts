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
import { verify } from "otplib";

jest.mock("otplib", () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verify: jest.fn(),
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("POST /twofactor/verify", () => {
  it("should return 400 when otp is missing from the request body", async () => {
    const user = await createDummyUser({
      twoFactorEnabled: true,
      password: "thisispassword",
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispassword" });

    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    const response = await request(app)
      .post("/api/auth/twofactor/login")
      .set("Cookie", cookies)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("OTP is required");
  });
  it("should return 400 when no token provided", async () => {
    const response = await request(app)
      .post("/api/auth/twofactor/login")
      .send({ otp: "000000" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Token not found, Retry login again");
  });
  it("should return 400 and message 2FA setup not initiated — call /twofactor/setup first", async () => {
    const user = await createDummyUser({
      twoFactorEnabled: true,
      password: "thisispassword",
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispassword" });

    const cookies = loginResponse.header["set-cookie"] as unknown as string[];
    const response = await request(app)
      .post("/api/auth/twofactor/login")
      .set("Cookie", cookies)
      .send({ otp: "000000" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "2FA setup not initiated — call /twofactor/setup first",
    );
  });
  it("should return 401 for an invalid OTP", async () => {
    const user = await createDummyUser({
      twoFactorEnabled: true,
      password: "thisispassword",
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispassword" });

    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    const userFromDb = await User.findById(user.id);
    userFromDb!.twoFactorSecret = "FAKESECRET123";
    await userFromDb!.save();

    jest.mocked(verify).mockResolvedValue({ valid: false });

    const response = await request(app)
      .post("/api/auth/twofactor/login")
      .set("Cookie", cookies)
      .send({ otp: "000000" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("invalid OTP ");
  });
  it("should return 200 and message of successful login", async () => {
    const user = await createDummyUser({
      twoFactorEnabled: true,
      password: "thisispassword",
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispassword" });

    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    const userFromDb = await User.findById(user.id);
    userFromDb!.twoFactorSecret = "FAKESECRET123";
    await userFromDb!.save();

    jest.mocked(verify).mockResolvedValue({ valid: true, delta: 0 });

    const response = await request(app)
      .post("/api/auth/twofactor/login")
      .set("Cookie", cookies)
      .send({ otp: "000000" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User logged in successfully");

    const resCookie = response.header["set-cookie"] as unknown as string[];

    const accessToken = resCookie.find((c) => c.startsWith("token="));
    const refreshToken = resCookie.find((c) => c.startsWith("token="));
    const tempToken = resCookie.find((c) => c.startsWith("tempToken="));
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(tempToken).toMatch(/Expires=Thu, 01 Jan 1970/);

    const updatedUser = await User.findById(user.id);
    expect(updatedUser?.refreshToken).toBeDefined();
  });
});
