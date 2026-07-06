import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User";
import { getGoogleClientId, getGoogleClientSecret } from "./env";

passport.use(
  new GoogleStrategy(
    {
      clientID: getGoogleClientId(),
      clientSecret: getGoogleClientSecret(),
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }
        let user = await User.findOne({ email });
        if (user) {
          return done(null, user);
        }

        user = await User.create({
          email,
          googleId: profile.id,
          provider: "google",
          isVerified: true,
        });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
