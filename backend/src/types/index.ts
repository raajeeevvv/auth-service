import { JwtPayload } from "jsonwebtoken";

export interface AuthPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
}


// reason we addes this is that when we do "req.user" it say that user.email not defined because jwtPayload does not have
// email property so we need to tell typescript that we are adding email property to the user object in the request object.
// So we need to create a new type that extends the Request type and add the email,id,role property to it.