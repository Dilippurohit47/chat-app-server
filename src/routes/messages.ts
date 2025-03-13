import { prisma } from "../utils/prisma";
import express from "express"
export const saveMessage = async (senderId:string, receiverId:string, content:string) => {
  try {

    await prisma.messages.create({
      data: {
        senderId: senderId,
        receiverId: receiverId,
        content: content,
      },
    });
    console.log("msg saved")
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};


const app = express.Router()


app.get("/get-messages", async (req, res) => {
    try {
      const { senderId, receiverId } = req.query;
  
      if (!senderId || !receiverId) {
        return res.status(400).json({ error: "senderId and receiverId are required" });
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
  
  export default app;
  