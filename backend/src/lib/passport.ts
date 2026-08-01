import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../lib/prisma";
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

        const existingOAuthAccount = await prisma.oAuthAccount.findUnique({
          where: {
            provider_providerId: {
              provider: "google",
              providerId: profile.id,
            },
          },
          include: { user: true },
        });
        if (existingOAuthAccount) {
          return done(null, existingOAuthAccount.user);
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          // A user with this email already exists (e.g. signed up locally)
          // but has no linked Google account yet — link it now.
          await prisma.oAuthAccount.create({
            data: {
              provider: "google",
              providerId: profile.id,
              userId: existingUser.id,
            },
          });
          return done(null, existingUser);
        }

        const newUser = await prisma.user.create({
          data: {
            email,
            isVerified: true,
            oauthAccounts: {
              create: {
                provider: "google",
                providerId: profile.id,
              },
            },
          },
        });
        return done(null, newUser);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
