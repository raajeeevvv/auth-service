import request from "supertest";
import {
  describe,
  it,
  expect,
  afterEach,
  afterAll,
  jest,
} from "@jest/globals";
import { prisma } from "../lib/prisma";
import app from "../app";
import { createDummyUser } from "./helper/createDummyUser";

jest.mock("otplib", () => ({
  authenticator: {
    verify: jest.fn(),
    generate: jest.fn(),
  },
}));

afterEach(async () => {
  await prisma.user.deleteMany({}); // cascades to RefreshToken/OAuthAccount via onDelete: Cascade
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("authMiddleware", () => {
  it("should return 401 when no token is provided", async () => {
    const response = await request(app).get("/api/auth/protected-test-only");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("No token provided");
  });

  it("should return 401 for an invalid token", async () => {
    const response = await request(app)
      .get("/api/auth/protected-test-only")
      .set("Cookie", ["token=garbage.invalid.token"]);
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid or expired token");
  });

  it("should return 200 with a valid token", async () => {
    await createDummyUser({});

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisispassword" });

    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    const response = await request(app)
      .get("/api/auth/protected-test-only")
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("ok");
  });
});
