import express, { NextFunction, Request, Response } from "express";
import { prisma } from "../infra/database/prisma";
import { formatZodError, JWT_PASSWORD, sendToken } from "../utils/helper";
import jwt, { JwtPayload } from "jsonwebtoken";
import { singnUpSchema } from "../types/zod";
import redis from "../redis/redis";
import { google } from "googleapis";
import { GoogleUserTypes } from "../types/index";
import bcrypt from "bcrypt"
import { verifyAccessToken } from "../middlewares/VerifyAccessToken";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "postmessage"
);
const app = express.Router();


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
        publickey:true
      },
    });

    if (!user) {
      res.status(404).json({
        message: "user not found",
      });
      return;
    }

    const hashedPassword = await bcrypt.compare(password,user.password!)
    if (!hashedPassword) {
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
    console.log("error in sign in",error);
    res.status(500).json({
      message: "Internal server error",  
    });
  }
});

app.post("/sign-up", async (req: Request, res: Response) => {
  try {
    const { name, email, password, profileUrl , publicKey } = req.body;
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
      res.status(409).json({
        message: "User with this email already exist",
      });
      return;
    }
    const hashedPassword = await bcrypt.hash(password,10)
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        profileUrl,
        publickey:publicKey,
      },
    });

   const refreshToken = sendToken(res, user);

   const updatedUser = await prisma.user.update({
    where:{
      id:user.id
    },data:{
      refreshToken:refreshToken
    }
   })

    res.status(200).json({
      message: "User created Successfully",
      token:refreshToken,
      user:updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});



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
        publickey:true,
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
        publickey:true,
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


app.post("/save-user-count",async(req:Request ,res:Response) =>{
  try {
    const userName = req.body.userName

    if(!userName){
      console.log("username not provided")
         res.status(400).json({
      success:false 
    })
    return
    }

      await prisma.habitTrackerUsers.create({
      data:{
        userName:userName
      } 
    })

     res.status(200).json({
      success:true
    })
return
  } catch (error) {
       res.status(500).json({
      success:false
    })
  }
})

app.get("/get-save-user",async(req:Request,res:Response)=>{
  try {
    const data = await prisma.habitTrackerUsers.findMany()
     res.status(200).json({
      users:data,
      totalUsers:data?.length
     })
     return
  } catch (error) {
    res.status(200).json({
      success:false
    })
    
  }
})

app.get("/check-username",async(req:Request,res:Response)=>{
try {
const username = req.query.username  as string
const exists  = await redis.sIsMember("usernames", username); 
console.log(exists)

if (!exists) {
    const user = await prisma.user.findUnique({
    where:{
      name:username
    }
  })
  
  if (user) {
    await redis.sAdd("usernames", username);
  }
}
     res.status(200).json({
        success:true,
        exist:exists === 1 ? true : false
    })
} catch (error) {
    console.log(error)
    res.status(500).json({
      success:false,
      error:"Internals server error"
    })
    return
}

})


export default app;
 