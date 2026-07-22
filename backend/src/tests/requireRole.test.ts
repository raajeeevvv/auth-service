import express from "express";
import request from "supertest";
import { describe, it, expect } from "@jest/globals";
import { requireRole } from "../middleware/requireRole";
import { AuthPayload } from "../types";

function buildTestApp(fakeUser: AuthPayload | null) {
  const app = express();
  app.use((req, res, next) => {
    if (fakeUser) {
      req.user = fakeUser;
    }
    next();
  });

  app.get("/test-route", requireRole("admin"), (req, res) => {
    res.status(200).json({ message: "allowed" });
  });
  return app;
}

describe("requireRole middleware", () => {
  it("should allow access for a user witht the correct role", async () => {
    const app = buildTestApp({
      email: "test@test.com",
      id: "1",
      role: "admin",
    });
    const response = await request(app).get("/test-route");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("allowed");
  });
  it("should return 403 for a user with wrong role", async () => {
    const app = buildTestApp({ email: "test@test.com", id: "1", role: "user" });

    const response = await request(app).get("/test-route");

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden — insufficient permissions");
  });
  it("should return 401 when there is no user in request",async()=>{
    const app = buildTestApp(null);
    const response = await request(app).get("/test-route");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized")

  })
});
