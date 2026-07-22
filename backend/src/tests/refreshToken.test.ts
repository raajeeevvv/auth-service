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

describe("Logout", () => {
  it("should return 401 when no refresh token provided", async () => {
    const response = await request(app).post("/api/auth/refresh");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No refresh token provided");
  });

  it("should return 401 when invalid refresh token provided", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", ["refreshToken=invalid-token"]);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid refresh token");
  });
  it("should return 200 and a new access token cookie for a valid refresh token", async () => {
    await createDummyUser();

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisispassword" });

    const loginCookies = loginResponse.header[
      "set-cookie"
    ] as unknown as string[];

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", loginCookies);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Token refreshed successfully");

    const newCookies = response.header["set-cookie"] as unknown as string[];
    const newAccessTokenCookie = newCookies.find((c) => c.startsWith("token="));
    expect(newAccessTokenCookie).toBeDefined();
  });

  it("should return 401 when using a refresh token that was revoked by logout", async () => {
    await createDummyUser();

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisispassword" });

    const loginCookies = loginResponse.header[
      "set-cookie"
    ] as unknown as string[];

    //logout to remove refresh token from DB
    await request(app).post("/api/auth/logout").set("Cookie", loginCookies);

    // attemp to resuse the OLD refresh token cookie
    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", loginCookies);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid refresh token");
  });
});
