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
    const user = await createDummyUser({});
    const response = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: user.email });
    expect(response.status).toBe(200);

    const userFromDb = await prisma.user.findUnique({ where: { id: user.id } });
    expect(userFromDb?.resetPasswordTokenHash).toBeDefined();
    expect(userFromDb?.resetPasswordExpires).toBeDefined();
  });
});
