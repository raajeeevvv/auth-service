import express from "express";
import passport from "../config/passport";

const router = express.Router();
import { authControllerSignup } from "../controllers/authControllerSignup";
import { authControllerLogin } from "../controllers/authControllerLogin";
import { authControllerLogout } from "../controllers/authControllerLogout";
import { authControllerRefreshToken } from "../controllers/authControllerRefreshToken";
import { authControllerForgotPassword } from "../controllers/authControllerForgotPassword";
import { authControllerResetPassword } from "../controllers/authControllerResetPassword";
import { authControllerSendVerification } from "../controllers/authControllerSendVerification";
import { authControllerVerifyEmail } from "../controllers/authControllerVerifyEmail";
import { authLimiter, generalLimiter } from "../middleware/rateLimiter";
import { authControllerGoogleCallback } from "../controllers/authControllerGoogleCallback";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";

router.post("/login", authLimiter, authControllerLogin);
router.post("/forgot-password", authLimiter, authControllerForgotPassword);
router.post("/send-verification", authLimiter, authControllerSendVerification);
router.post("/signup", authLimiter, authControllerSignup);

router.post("/logout", generalLimiter, authControllerLogout);
router.post("/refresh", generalLimiter, authControllerRefreshToken);
router.post("/reset-password", generalLimiter, authControllerResetPassword);
router.post("/verify-email", generalLimiter, authControllerVerifyEmail);

//redirect user to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] }),
);

//Google redirects back here with a code
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authControllerGoogleCallback,
);

router.get("/admin-only", authMiddleware, requireRole("admin"), (req, res) => {
  res.json({ message: "Welcome admin" });
});

export default router;
