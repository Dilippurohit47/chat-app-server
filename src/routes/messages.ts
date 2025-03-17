import { prisma } from "../utils/prisma";
import express from "express";
export const saveMessage = async (
  senderId: string,
  receiverId: string,
  content: string
) => {
  try {
    await prisma.messages.create({
      data: {
        senderId: senderId,
        receiverId: receiverId,
        content: content,
      },
    });
    console.log("msg saved");
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const app = express.Router();

app.get("/get-messages", async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ error: "senderId and receiverId are required" });
    }

    // Fetch messages where:
    // - The sender is senderId and receiver is receiverId
    // - OR the sender is receiverId and receiver is senderId
    const messages = await prisma.messages.findMany({
      where: {
        OR: [
          { senderId, receiverId }, // Messages sent by senderId to receiverId
          { senderId: receiverId, receiverId: senderId }, // Messages sent by receiverId to senderId
        ],
      },
      orderBy: {
        createdAt: "asc", // Order messages by creation time (oldest first)
      },
      include: {
        sender: true, // Include sender details
        receiver: true, // Include receiver details
      },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/create-chats", async (req, res) => {
  try {
    const { userId1, userId2, lastMessage } = req.body;

    const chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { userId1: userId1, userId2: userId2 },
          { userId1: userId2, userId2: userId1 },
        ],
      },
    });

    if (chat) {
      await prisma.chat.update({
        where: {
          id: chat.id,
        },
        data: {
          lastMessage: lastMessage,
        },
      });
    } else {
      await prisma.chat.create({
        data: {
          userId1: userId1,
          userId2: userId2,
          lastMessage: lastMessage,
        },
      });
    }

    res.json({
      message: "Chat created",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.get("/get-recent-chats", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(404).json({
        message: "Login first",
      });
      return
    }
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      orderBy: {
        lastMessage: "desc",
      },
      include:{
        user1:true,
        user2:true,
      }
    });

  
  const formattedChats = chats.map((chat) =>{
    const otherUser = chat.user1.id === userId ?  chat.user2 : chat.user1
    return {
      id:chat.id,
      lastMessage:chat.lastMessage,
      lastMessageCreatedAt: chat.lastMessageCreatedAt,
      otherUser
    }

  })
    res.json({
      chats: formattedChats,
    });
    return
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default app;
