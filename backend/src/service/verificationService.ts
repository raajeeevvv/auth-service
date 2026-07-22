import { IUser } from "../models/User";
import { generateHashedToken, generateToken } from "../utils/token";

export async function sendVerificationEmail(user: IUser) {
  const rawToken = generateToken(); // this will be shared to the email
  const hashedToken = generateHashedToken(rawToken); // this will be stored in db to authenticate

  // generate the email link
  const link = `http://localhost:5173/verify-email?token=${rawToken}`;

  user.verifyEmailTokenHash = hashedToken;
  user.verifyEmailExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();


  //TODO: send link to user email

  console.log("email Link is", link);
}
