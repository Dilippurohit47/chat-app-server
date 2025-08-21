import express, { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authorizeToken } from "../middlewares";
import redis from "../redis/redis"
const app = express.Router();

app.post("/create-group", async (req: Request, res: Response) => {
  try {
    const { name, members } = req.body;
    if (!name || members.length <= 0) {
      res.status(403).json({
        message: "Missing elements required",
      });
      return;
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

app.get("/", authorizeToken, async (req: Request, res: Response) => {
  try {

    const userId = req.user.id;

    const cachedgroups = await redis.get(`groupId:${userId}`)

    if(cachedgroups){
      res.status(200).json({
        groups:JSON.parse(cachedgroups),
        message:"from redis cache"
      })
      return
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
        deletedby:{
          none:{
            userId:userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      
    });

    await redis.set(`groupId:${userId}`,JSON.stringify(groups),{
      EX:'3600'
    })

    res.status(200).json({
      groups: groups,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
});

app.post("/add-new-members", async (req, res) => {
  try {
    const { newMembers } = req.body;
    const { groupId } = req.query;
    if (!groupId) {
      res.status(403).json({
        message: "Group id is absent!",
      });
    }
    const data = await prisma.group.update({
      where: {
        id: groupId,
      },
      data: {
        members: {
          create: newMembers.map((id) => ({
            user: { connect: { id: id } },
          })),
        },
      },
    });
    res.status(200).json({
      message: "Group updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
    return;
  }
});

app.delete("/delete-group/:groupId/:userId", async (req, res) => {
  try {
    const { groupId  ,userId} = req.params;
    if(!groupId || !userId){
      console.log("user id and group id required for deleting group")
      return res.status(403).json({
        message:"Insufficent credentials"
      })
    }
   
    await prisma.deletedGroup.create({
      data:{
        userId:userId,
        groupId:groupId
      }
    })

res.status(200).json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    res.send(500);
    console.log(error);
  }
});

export default app;
