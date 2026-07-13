import express from "express";
import request from "supertest";
import { describe, it, expect } from "@jest/globals";
import { rateLimit } from "express-rate-limit";

describe("Rate limiter behavior", () => {
  it("should allow requests within the limit", async () => {
    const testApp = express();
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 3,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many requests, please try again later" },
    });
    testApp.get("/test-route", limiter, (req, res) => res.status(200).json({ ok: true }));

    for (let i = 0; i < 3; i++) {
      const res = await request(testApp).get("/test-route");
      expect(res.status).toBe(200);
    }
  });

  it("should block requests after exceeding the limit", async () => {
    const testApp = express();
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 3,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many requests, please try again later" },
    });
    testApp.get("/test-route", limiter, (req, res) => res.status(200).json({ ok: true }));

    for (let i = 0; i < 3; i++) {
      await request(testApp).get("/test-route");
    }

    const blockedResponse = await request(testApp).get("/test-route");
    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body.message).toBe(
      "Too many requests, please try again later",
    );
  });
});