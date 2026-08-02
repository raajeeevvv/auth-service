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
    const userFromDb = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userFromDb?.verifyEmailTokenHash).toBeNull();
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
    const userFromDb = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userFromDb?.verifyEmailTokenHash).toBeDefined();
    expect(userFromDb?.verifyEmailExpires).toBeDefined();
  });
});
