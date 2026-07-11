import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
  jest,
} from "@jest/globals";
import mongoose from "mongoose";
import app from "../app";
import User from "../models/User";

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

describe("POST /signup", () => {
  it("should return 201 and create a user for valid input", async () => {
    const payload = { email: "test@test.com", password: "123456789" };
    const response = await request(app).post("/api/auth/signup").send(payload);
    expect(response.status).toBe(201);
    const user = await User.findOne({ email: payload.email });
    expect(user).not.toBeNull();
  });

  it("should return 409 for a duplicate email", async () => {
    await User.create({
      email: "test@test.com",
      password: "irrelevant-for-this-test",
      provider: "local",
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
