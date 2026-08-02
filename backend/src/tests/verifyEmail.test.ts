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
import app from "../app";
import { createDummyUser } from "./helper/createDummyUser";
import { generateHashedToken } from "../utils/token";
import { prisma } from "../lib/prisma";

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

    const userFromDb = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userFromDb?.verifyEmailTokenHash).toBeNull();
    expect(userFromDb?.verifyEmailExpires).toBeNull();
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

    const userFromDb = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userFromDb?.isVerified).toBe(true);
    expect(userFromDb?.verifyEmailTokenHash).toBeNull();
    expect(userFromDb?.verifyEmailExpires).toBeNull();
    console.log(process.env.NODE_ENV);
  });
});
