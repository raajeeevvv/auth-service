import request from "supertest";
import {
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  jest,
} from "@jest/globals";
import app from "../app";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../utils/password";
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

describe("POST /login", () => {
  it("should return status code 200 and add access & refress token to cookie", async () => {
    const hashedPassword = await hashPassword("thisispassword");
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: hashedPassword,
        isVerified: true,
      },
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
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: hashedPassword,
        isVerified: true,
      },
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

  it("should return 403 with message helpful message to verified user", async () => {
    const user = await createDummyUser({
      password: "thisispass",
      isVerified: true,
    });
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "wrong-password" });
    }
    const userFromDb = await prisma.user.findUnique({ where: { id: user.id } });
    const failedLoginAttempts = userFromDb?.failedLoginAttempts;
    expect(failedLoginAttempts).toBe(5);
    expect(userFromDb?.lockUntil).not.toBeNull();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispass" });
    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Account is locked due to multiple failed login attempts. Please try again later.",
    );
  });

  it("should reset failedLogoutAttempt count to 0 after successfull login", async () => {
    const user = await createDummyUser({
      password: "thisispass",
      isVerified: true,
    });
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password: "wrong-password" });
    }
    const userFromDb = await prisma.user.findUnique({ where: { id: user.id } });
    const failedLoginAttempts = userFromDb?.failedLoginAttempts;
    expect(failedLoginAttempts).toBe(3);
    expect(userFromDb?.lockUntil).toBeNull();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispass" });
    const userFromDbAgain = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userFromDbAgain?.failedLoginAttempts).toBe(0);
    expect(userFromDbAgain?.lockUntil).toBeNull();
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User logged in successfully");
  });
});
