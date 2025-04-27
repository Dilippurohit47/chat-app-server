import JWT from "jsonwebtoken";
import { Response } from "express"
import { UserType } from "../types";
export const JWT_PASSWORD = "";



export const sendToken = (res:Response, user:UserType) => {

  if (!res || !user) {
    console.error("response or user needed");
    return; 
  }

  const cookieName = "chat-token";
  try {
    const token = JWT.sign({ id: user.id }, JWT_PASSWORD, {
      expiresIn: "30d",
    });

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure only in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" in prod, "lax" in dev
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    return token
  } catch (err) {
    console.error("Error generating or sending token:", err);
  }
};


export const formatZodError = (issues) =>{
  const error = issues.map((firstError) =>{
    return firstError.message
  })
  return error
}