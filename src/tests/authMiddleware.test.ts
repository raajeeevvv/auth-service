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
    await createDummyUser()

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
