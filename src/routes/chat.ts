import express, { Request, Response } from "express";
import { prisma } from "../utils/prisma";
const app = express.Router();

app.delete("/clear-chat", async (req: Request, res: Response) => {
  try {
    const { userId, chatId } = req.body;

    const messages = await prisma.messages.findMany({
      where: { chatId: chatId },
      select: { id: true },
    });
console.log(messages)
console.log(messages.length)
    await prisma.deletedMessage.createMany({
      data: messages.map((msg) => ({
        userId: userId,
        messageId: msg.id,
      })),
      skipDuplicates: true,
    });
    res.status(200).json({
      message:"Chat clear"
    })
  } catch (error) {
    console.log("error while deleting chat", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.delete("/delete-chat", async (req: Request, res: Response) => {
  try {
    const { userId, chatId } = req.body;
  const chat =    await prisma.deletedChat.create({
      data: {
        chatId: chatId,
        userId: userId,
      },
    });
console.log(chat)
    return res.status(200).json({
      message:"Deleted successfully"
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message:"Internal server Error"
    })
  }
});
export default app;
