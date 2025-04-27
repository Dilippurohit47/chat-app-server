import express, { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authorizeToken } from "../middlewares";

const app = express.Router();

app.post("/create-group", async (req: Request, res: Response) => {
  try {
    const { name, members } = req.body;
    if(!name || members.length < 0){
        res.status(403).json({
            message:"Missing elements required"
        })
        return
    }
    const group = await prisma.group.create({
      data: {
        name: name,
        members: {
          create: members.map((userId) => ({
            user: { connect: { id: userId } },
          })),
        },
      },
    });
    console.log(group);
    res.status(200).json({
      message: "Group Created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/", authorizeToken, async(req:Request,res:Response) =>{
  try {
    
  } catch (error) {
    
  }
})

export default app;
