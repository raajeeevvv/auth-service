import request from "supertest";
import {
  jest,
  describe,
  expect,
  it,
  afterAll,
  afterEach,
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

describe("Dummy sanity test", () => {
  it("should hit a route and get a response", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBeDefined();
  });
});