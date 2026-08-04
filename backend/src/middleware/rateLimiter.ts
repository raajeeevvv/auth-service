import { Response, Request, NextFunction } from "express";
import redis from "../lib/redis";

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowSeconds, maxRequests, keyPrefix } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip;
    const key = `ratelimit:${keyPrefix}:${identifier}`;

    try {
      const count = await redis.incr(key);
      if (count == 1) {
        await redis.expire(key, windowSeconds);
      }
      if (count > maxRequests) {
        const ttl = await redis.ttl(key);
        res.setHeader("Retry-After", ttl > 0 ? ttl : windowSeconds);
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
        });
      }
      next();
    } catch (error) {
      console.error("Rate limiter error:", error);
      // fail open — don't block auth if Redis is down
      next();
    }
  };
}
