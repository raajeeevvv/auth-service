import request from "supertest";
import { jest, describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import app from "../app";

jest.mock("otplib", () => ({
  authenticator: {
    verify: jest.fn(),
    generate: jest.fn(),
  },
}));

let mongoServer: MongoMemoryServer;

// runs ONCE before all tests in this file
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// runs ONCE after all tests in this file — cleanup so that mongo instance don't become a zomie
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Dummy sanity test", () => {
  it("should hit a route and get a response", async () => {
    const response = await request(app).get("/health");
    console.log(process.env.GOOGLE_CLIENT_SECRET);
    expect(response.status).toBeDefined();
  });
});
