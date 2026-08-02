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

describe("POST /signup", () => {
  it("should return 201 and create a user for valid input", async () => {
    const payload = { email: "test@test.com", password: "123456789" };
    const response = await request(app).post("/api/auth/signup").send(payload);
    expect(response.status).toBe(201);
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    expect(user).not.toBeNull();
  });

  it("should return 409 for a duplicate email", async () => {
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: "irrelevant-for-this-test",
      },
    });
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@test.com", password: "irrelevant-for-this-test" });
    expect(response.status).toBe(409);
  });

  it("should return 400 for malformed email", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ email: "testtest", password: "123456789" });
    expect(response.status).toBe(400);
  });

  it("should return 400 for password under minimum length", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ email: "test@test.com", password: "2" });
    expect(response.status).toBe(400);
  });
});
