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
    await createDummyUser({});
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisispassword" });
    const loginCookies = loginResponse.header["set-cookie"] as unknown as string[];
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
    await createDummyUser({});
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisispassword" });
    const loginCookies = loginResponse.header["set-cookie"] as unknown as string[];
    await request(app).post("/api/auth/logout").set("Cookie", loginCookies);
    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", loginCookies);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid refresh token");
  });
});
