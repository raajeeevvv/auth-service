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
import { verify } from "otplib";

jest.mock("otplib", () => ({
  generateSecret: jest.fn(),
  generateURI: jest.fn(),
  verify: jest.fn(),
}));

afterEach(async () => {
  await prisma.user.deleteMany({}); // cascades to RefreshToken/OAuthAccount via onDelete: Cascade
  jest.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /twofactor/verify", () => {
  it("should return 200 and enable 2FA for a valid OTP", async () => {
    const user = await createDummyUser({});
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispassword" });
    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    // simulate that setup already ran and stored a secret
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: "FAKESECRET123" },
    });

    jest.mocked(verify).mockResolvedValue({ valid: true, delta: 0 });
    const response = await request(app)
      .post("/api/auth/twofactor/verify")
      .set("Cookie", cookies)
      .send({ otp: "123456" });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Two Factor Successfull");

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updatedUser?.twoFactorEnabled).toBe(true);
  });

  it("should return 401 for an invalid OTP", async () => {
    const user = await createDummyUser({});
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispassword" });
    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: "FAKESECRET123" },
    });

    jest.mocked(verify).mockResolvedValue({ valid: false });
    const response = await request(app)
      .post("/api/auth/twofactor/verify")
      .set("Cookie", cookies)
      .send({ otp: "000000" });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("invalid OTP ");
  });

  it("should return 400 when 2FA setup was never initiated", async () => {
    const user = await createDummyUser({});
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispassword" });
    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    const response = await request(app)
      .post("/api/auth/twofactor/verify")
      .set("Cookie", cookies)
      .send({ otp: "123456" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "2FA setup not initiated — call /twofactor/setup first",
    );
  });

  it("should return 400 when otp is missing from the request body", async () => {
    const user = await createDummyUser({});
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "thisispassword" });
    const cookies = loginResponse.header["set-cookie"] as unknown as string[];

    const response = await request(app)
      .post("/api/auth/twofactor/verify")
      .set("Cookie", cookies)
      .send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("OTP is required");
  });
});
