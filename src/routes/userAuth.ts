import express, { NextFunction, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { formatZodError, JWT_PASSWORD, sendToken } from "../utils/helper";
import jwt, { JwtPayload } from "jsonwebtoken";
import { singnUpSchema } from "../types/zod";
import redis from "../redis/redis";
import { google } from "googleapis";
import { GoogleUserTypes } from "../types/index";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "postmessage"
);
const app = express.Router();

type user = {
  id: string;
};
declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookie = req.cookies["chat-token"];

    if (!cookie) {
      return res.status(404).json({
        message: "Please login first",
      });
    }
    const decoded = jwt.verify(cookie, process.env.JWT_SECRET!);
    if (!decoded) {
      res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (typeof decoded === "string") {
      return;
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      succcess: false,
      message: "Internal server error",
    });
  }
};

app.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(404).json({
        message: "Please Fill all fields",
      });
      return;
    }
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        id: true,
        profileUrl: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "user not found",
      });
      return;
    }
    if (user?.password !== password) {
      res.status(403).json({
        message: "Password or email is incorrect",
      });
      return;
    }

    const token = sendToken(res, user);
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: token,
      },
    });

    res.status(200).json({
      message: "Login successfull",
      token: token,
      user,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/sign-up", async (req: Request, res: Response) => {
  try {
    const { name, email, password, profileUrl } = req.body;

    const parsedData = singnUpSchema.safeParse(req.body);

    if (!parsedData.success) {
      const dataError = formatZodError(parsedData.error.issues);
      res.status(403).json({
        message: dataError[0],
      });
      return;
    }

    const userExist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (userExist) {
      res.status(404).json({
        message: "User with this email already exist",
      });
      return;
    }
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: password,
        profileUrl,
      },
    });

    sendToken(res, user);
    res.status(200).json({
      message: "User created Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      res.status(401).json({ message: "Access token missing" });
      return;
    }
console.log("atutyh",authHeader)
    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Invalid authorization header" });
      return;
    }

console.log("token",token)
    jwt.verify(token, JWT_PASSWORD, (err, decoded) => {
      if (err) {
        console.log(err);
        res.status(403).json({ message: "Invalid or expired token" });
        return;
      }
      if (typeof decoded === "string") {
        return;
      }
      req.user = decoded; 
      next();
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
    return;
  }
};

app.get("/get-user", verifyAccessToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(404).json({
        success: false,
        message: "Authorization failed",
      });
      return;
    }
    const userId = req.user.id;
    const cachedUser = await redis.get(`user:${userId}`);
    if (cachedUser) {
      res.status(200).json({ user: JSON.parse(cachedUser) });
      return;
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        profileUrl: true,
        name: true,
        id: true,
      },
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    await redis.set(`user:${user.id}`, JSON.stringify(user), {
      EX: 3600,
    });

    res.status(200).json({ user: user, message: "user fetched" });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/all-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profileUrl: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/refresh", async (req: Request, res: Response) => {
  const token = req.cookies["chat-token"];
  try {
    if (!token) {
      res.status(403).json({
        message: "Unauthorized",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        refreshToken: token,
      },
    });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized , Login first",
      });
      return;
    }
    if (!user.refreshToken) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    try {
      jwt.verify(user.refreshToken, JWT_PASSWORD);
    } catch (err) {
      res.clearCookie("chat-token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      res
        .status(403)
        .json({ message: "Refresh token expired, please login again" });
      return;
    }

    if (!user) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }
    const accessToken = jwt.sign({ id: user.id }, JWT_PASSWORD, {
      expiresIn: "15m",
    });

    res.status(200).json({
      accessToken,
    });
    return;
  } catch (error) {
    console.log("error in generating accesstoken", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/checking", verifyAccessToken, async (req, res) => {
  try {
    res.json();
  } catch (error) {
    console.log(error);
  }
});

app.post("/sign-out", (req: Request, res: Response) => {
  try {
    res.clearCookie("chat-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/google/callback", async (req, res) => {
  try {
    console.log("reached in callback");
    const { credentialResponse } = req.body;
    const code = credentialResponse?.code;

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`
    );

    const userInfo = (await userInfoResponse.json()) as GoogleUserTypes;
    console.log("userinfo", userInfo);
    const user = await prisma.user.findFirst({
      where: {
        email: userInfo.email,
      },
    });

    if (user) {
      console.log("user",user)
   const token =   sendToken(res, user);
          await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: token,
      },
    });
      res.status(200).json({ message: "Welcome back" });
      return;
    }

    const newUser  = await prisma.user.create({
      data:{
        name:userInfo.name,
        email:userInfo.email,
        profileUrl:userInfo.picture,
      }
    })
    if(newUser){
    const token =   sendToken(res,newUser)
         await prisma.user.update({
      where: {
        id: newUser.id,
      },
      data: {
        refreshToken: token,
      },
    });
    }

    res.status(200).json({user:newUser, message: "welcome to chat-app" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
