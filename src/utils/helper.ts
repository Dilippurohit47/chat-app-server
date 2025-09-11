import JWT from "jsonwebtoken";
import { Response } from "express"
import { UserType } from "../types";
import dotenv from "dotenv"
import { ZodIssue } from "zod";
dotenv.config()
export const JWT_PASSWORD = process.env.JWT_SECRET || "123456";



export const sendToken = (res:Response, user:UserType) => {
  if (!res || !user) {
    console.error("response or user needed");
    return; 
  } 
if(!JWT_PASSWORD){
  throw new Error("Jwt secret is required");
  
}
  const cookieName = "chat-token";
  try {
    const token = JWT.sign({ id: user.id }, JWT_PASSWORD, {
      expiresIn: "30d",
    });

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
    return token
  } catch (err) {
    console.error("Error generating or sending token:", err);
  }
};


export const formatZodError = (issues:ZodIssue[]) =>{
  const error = issues.map((firstError) =>{
    return firstError.message
  })
  return error
}