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

router.post("/signup", authControllerSignup);
router.post("/login", authControllerLogin);
router.post("/logout", authControllerLogout);
router.post("/refresh", authControllerRefreshToken);
router.post("/forgot-password", authControllerForgotPassword);
router.post("/reset-password", authControllerResetPassword);
router.post("/send-verification", authControllerSendVerification);
router.post("/verify-email", authControllerVerifyEmail);

export default router;
