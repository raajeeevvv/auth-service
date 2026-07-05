import express from "express";
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

router.post("/login", authLimiter, authControllerLogin);
router.post("/forgot-password", authLimiter, authControllerForgotPassword);
router.post("/send-verification", authLimiter, authControllerSendVerification);
router.post("/signup", authLimiter, authControllerSignup); 

router.post("/logout", generalLimiter, authControllerLogout);
router.post("/refresh", generalLimiter, authControllerRefreshToken);
router.post("/reset-password", generalLimiter, authControllerResetPassword);
router.post("/verify-email", generalLimiter, authControllerVerifyEmail);

export default router;
