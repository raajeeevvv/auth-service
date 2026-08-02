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
import { hashPassword } from "../utils/password";

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

describe("Logout", () => {
  it("should return 200 with a valid token", async () => {
    const hashedPassword = await hashPassword("thisispassword");
    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        password: hashedPassword,
        isVerified: true,
      },
    });
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "thisispassword" });
    const loginCookie = loginResponse.header["set-cookie"];
    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", loginCookie);
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.message).toBe("Logged out successfully");
    const cookies = logoutResponse.header["set-cookie"] as unknown as string[];
    const tokenCookie = cookies.find((c) => c.startsWith("token="));
    const refreshCookie = cookies.find((c) => c.startsWith("refreshToken="));
    expect(tokenCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(refreshCookie).toMatch(/Expires=Thu, 01 Jan 1970/);

    const storedRefreshTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id },
    });
    expect(storedRefreshTokens).toHaveLength(0);
  });

  it("should return 401 when logging out without a valid token", async () => {
    const response = await request(app).post("/api/auth/logout");
    expect(response.status).toBe(401);
  });
});
