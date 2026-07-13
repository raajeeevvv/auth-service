import { rateLimit } from "express-rate-limit";



const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true, //tells user that they are being rate limited and how much hit they left before being blocked
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { message: "Too many requests, please try again later" },
  skip: () => process.env.NODE_ENV === "test",
});
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
  message: { message: "Too many requests, please try again later" },
});

export { authLimiter, generalLimiter };
