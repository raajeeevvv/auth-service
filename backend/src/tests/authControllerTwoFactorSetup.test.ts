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
import { createDummyUser } from "./helper/createDummyUser";
import { generateSecret, generateURI } from "otplib";
import qrcode from "qrcode";

// Mock the modules
jest.mock("otplib", () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("qrcode", () => ({
  __esModule: true,
  default: {
    toDataURL: jest.fn(),
  },
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await User.deleteMany({});
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("POST /twofactor/setup", () => {
  it("should return 200, save a secret, and return a QR code for a user without 2FA enabled", async () => {
    const user = await createDummyUser({ twoFactorEnabled: false });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "thisispassword",
    });

    const cookies = loginResponse.header["set-cookie"] as unknown as string[]; 

    (qrcode.toDataURL as jest.Mock).mockImplementation(async () => {
      return "data:image/png;base64,fake";
    });

    jest.mocked(generateSecret).mockReturnValue("FAKESECRET123");
    jest.mocked(generateURI).mockReturnValue("otpauth://totp/fake-uri");

    const response = await request(app)
      .post("/api/auth/twofactor/setup")
      .set("Cookie", cookies);

    expect(response.status).toBe(200);
    expect(response.body.qrCodeDataUrl).toBe("data:image/png;base64,fake");

    const userFromDb = await User.findById(user.id);

    expect(userFromDb?.twoFactorSecret).toBe("FAKESECRET123");
  });

  it("should return 400 when 2FA is already enabled", async () => {
    const user = await createDummyUser({
      twoFactorEnabled: false,
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "thisispassword",
    });
    const userFromDb = await User.findById(user.id);
    userFromDb!.twoFactorEnabled = true;
    await userFromDb?.save();

    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    const response = await request(app)
      .post("/api/auth/twofactor/setup")
      .set("Cookie", cookies);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("2FA is already enabled");
  });
});
