import express from "express";
import passport from "../lib/passport";
const router = express.Router();
import { authControllerSignup } from "../controllers/authControllerSignup";
import { authControllerLogin } from "../controllers/authControllerLogin";
import { authControllerLogout } from "../controllers/authControllerLogout";
import { authControllerRefreshToken } from "../controllers/authControllerRefreshToken";
import { authControllerForgotPassword } from "../controllers/authControllerForgotPassword";
import { authControllerResetPassword } from "../controllers/authControllerResetPassword";
import { authControllerSendVerification } from "../controllers/authControllerSendVerification";
import { authControllerVerifyEmail } from "../controllers/authControllerVerifyEmail";
import { rateLimiter } from "../middleware/rateLimiter";
import { authControllerGoogleCallback } from "../controllers/authControllerGoogleCallback";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { authControllerTwoFactorVerify } from "../controllers/authControllerTwoFactorVerify";
import { authControllerTwoFactorSetup } from "../controllers/authControllerTwoFactorSetup";
import { authControllerTwoFactorLogin } from "../controllers/authControllerTwoFactorLogin";

router.post(
  "/login",
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: "login" }),
  authControllerLogin,
);
router.post(
  "/forgot-password",
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: "forgot-password" }),
  authControllerForgotPassword,
);
router.post(
  "/send-verification",
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: "send-verification" }),
  authControllerSendVerification,
);
router.post(
  "/signup",
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: "signup" }),
  authControllerSignup,
);
router.post(
  "/logout",
  rateLimiter({ windowSeconds: 60, maxRequests: 20, keyPrefix: "logout" }),
  authMiddleware,
  authControllerLogout,
);
router.post(
  "/refresh",
  rateLimiter({ windowSeconds: 60, maxRequests: 20, keyPrefix: "refresh" }),
  authControllerRefreshToken,
);
router.post(
  "/reset-password",
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: "reset-password" }),
  authControllerResetPassword,
);
router.post(
  "/verify-email",
  rateLimiter({ windowSeconds: 60, maxRequests: 10, keyPrefix: "verify-email" }),
  authControllerVerifyEmail,
);

//redirect user to Google
router.get(
  "/google",
  rateLimiter({ windowSeconds: 60, maxRequests: 10, keyPrefix: "google-auth" }),
  passport.authenticate("google", { scope: ["email", "profile"] }),
);
//Google redirects back here with a code
router.get(
  "/google/callback",
  rateLimiter({ windowSeconds: 60, maxRequests: 10, keyPrefix: "google-callback" }),
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authControllerGoogleCallback,
);

router.get("/admin-only", authMiddleware, requireRole("admin"), (req, res) => {
  return res.json({ message: "Welcome admin" });
}); //delete later
router.get("/protected-test-only", authMiddleware, (req, res) => {
  res.status(200).json({ message: "ok" });
});

router.post(
  "/twofactor/setup",
  rateLimiter({ windowSeconds: 60, maxRequests: 10, keyPrefix: "2fa-setup" }),
  authMiddleware,
  authControllerTwoFactorSetup,
);
router.post(
  "/twofactor/verify",
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: "2fa-verify" }),
  authMiddleware,
  authControllerTwoFactorVerify,
);
router.post(
  "/twofactor/login",
  rateLimiter({ windowSeconds: 60, maxRequests: 5, keyPrefix: "2fa-login" }),
  authControllerTwoFactorLogin,
);

export default router;
