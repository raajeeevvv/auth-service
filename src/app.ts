import express, { Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middleware/authMiddleware";
import passport from "./config/passport";


const app = express();

// middleware
app.use(express.json());
app.use(cookieParser()); // this is to parse the cookies as express doesn't do it at this own
app.use(passport.initialize());

// did this for using httponly cookie auth so that i later on don't get the bug that "browser don't send or reveiver cookies"
// if you want you can learn about this more later on
app.use(
  cors({
    origin: "http://localhost:5173", // your React dev server's actual URL/port
    credentials: true,
  }),
);

// health check — fine to keep during dev
app.get("/health", (req: Request, res: Response) => {
  res.send("Hello World!, This is your backend");
});

app.get("/api/auth/me", authMiddleware, (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});
// routes
app.use("/api/auth", authRoutes);

export default app;
