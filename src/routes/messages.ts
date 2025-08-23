import { prisma } from "../utils/prisma";
import express, { Request, Response } from "express";
 export const upsertRecentChats = async (
  userId1: string,
  userId2: string,
  lastMessage: string
) => {
  try {
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { userId1: userId1, userId2: userId2 },
          { userId1: userId2, userId2: userId1 },
        ],
      },
    });


    console.log(chat)
    if (chat) {
      await prisma.chat.update({
        where: {
          id: chat.id,
        },
        data: {
          lastMessage: lastMessage,
          lastMessageCreatedAt: new Date(),
          unreadCount: {
            userId: userId2,
            unreadMessages:
              chat.unreadCount?.unreadMessages != null
                ? chat.unreadCount.unreadMessages + 1
                : 1,
          },
        },
      });

      await prisma.deletedChat.deleteMany({
        where:{
          userId:{
            in:[userId1,userId2]
          },
          chatId:chat.id
        }
      })
    } else {
    chat =  await prisma.chat.create({
        data: {
          userId1: userId1,
          userId2: userId2,
          lastMessage: lastMessage,
          lastMessageCreatedAt: new Date(),
        },
      });
    }
    return chat
  } catch (error) {
    console.log(error);
  }
};
export const saveMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  isMedia:boolean
) => {
  try {
 
const chat  = await upsertRecentChats(senderId,receiverId,content)

await prisma.messages.create({
      data: {
        senderId: senderId,
        receiverId: receiverId,
        content: content,
        chatId: chat.id,
        isMedia:isMedia
      },
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const app = express.Router();

app.get("/get-messages", async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, cursor } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursorObj = cursor ? JSON.parse(cursor as string) : null;
    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ error: "senderId and receiverId are required" });
    }

    const messages = await prisma.messages.findMany({
      take: limit + 1,
      where: {
        OR: [
          {
            OR: [
              {
                senderId: senderId as string,
                receiverId: receiverId as string,
              },
              {
                senderId: receiverId as string,
                receiverId: senderId as string,
              },
            ],
            createdAt: {
              lt: cursorObj?.createdAt
                ? new Date(cursorObj.createdAt)
                : undefined,
            },
          },
          // Case 2: Same timestamp but older ID (tiebreaker)
          ...(cursorObj
            ? [
                {
                  OR: [
                    {
                      senderId: senderId as string,
                      receiverId: receiverId as string,
                    },
                    {
                      senderId: receiverId as string,
                      receiverId: senderId as string,
                    },
                  ],
                  createdAt: new Date(cursorObj.createdAt),
                  id: { lt: cursorObj.id },
                },
              ]
            : []),
        ].filter(Boolean),
        deletedBy: {
          none: {
            userId: receiverId,
          },
        }, // Remove empty conditions if no cursor
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { sender: true, receiver: true },
    });

    const hasMore = messages.length > limit;
    const messagesToSend = hasMore ? messages.slice(0, limit) : messages;
    const lastMessage = messagesToSend[messagesToSend.length - 1];

    res.status(200).json({
      messages: messagesToSend,
      cursor: hasMore
        ? {
            createdAt: lastMessage.createdAt,
            id: lastMessage.id,
          }
        : null,
      hasMore,
    });
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
          lastMessageCreatedAt: new Date(),
        },
      });
    } else {
      await prisma.chat.create({
        data: {
          userId1: userId1,
          userId2: userId2,
          lastMessage: lastMessage,
          lastMessageCreatedAt: new Date(),
          unreadCount: { userId: "", unreadMessages: 0 },
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
      return;
    }
    const chats = await prisma.chat.findMany({
      where: {
        AND: [
          {
            OR: [{ userId1: userId }, { userId2: userId }],
          },
          {
            deleteBy: {
              none: {
                userId: userId,
              },
            },
          },
        ],
      },
      orderBy: {
        lastMessageCreatedAt: "desc",
      },
      include: {
        user1: true,
        user2: true,
        deleteBy: true,
      },
    });

    const formattedChats = chats.map((chat) => {
      const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
      return {
        chatId: chat.id,
        lastMessage: chat.lastMessage,
        lastMessageCreatedAt: chat.lastMessageCreatedAt,
        unreadCount: chat.unreadCount,
        ...otherUser,
      };
    });
    res.json({
      chats: formattedChats,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.put("/update-unreadmessage-count", async (req, res) => {
  try {
    const { userId, chatId } = req.body;
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
    });
    if (chat?.unreadCount?.userId === userId) {
      await prisma.chat.update({
        where: {
          id: chatId,
        },
        data: {
          unreadCount: {
            userId: null,
            unreadMessages: 0,
          },
        },
      });
    }
    res.status(200).json({
      message: "Unread message count updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

// export const upsertRecentChats = async (
//   userId1: string,
//   userId2: string,
//   lastMessage: string
// ) => {
//   try {
//     const chat = await prisma.chat.findFirst({
//       where: {
//         OR: [
//           { userId1: userId1, userId2: userId2 },
//           { userId1: userId2, userId2: userId1 },
//         ],
//       },
//     });

//     if (chat) {
//       await prisma.chat.update({
//         where: {
//           id: chat.id,
//         },
//         data: {
//           lastMessage: lastMessage,
//           lastMessageCreatedAt: new Date(),
//           unreadCount: {
//             userId: userId2,
//             unreadMessages:
//               chat.unreadCount?.unreadMessages != null
//                 ? chat.unreadCount.unreadMessages + 1
//                 : 1,
//           },
//         },
//       });
//     } else {
//       await prisma.chat.create({
//         data: {
//           userId1: userId1,
//           userId2: userId2,
//           lastMessage: lastMessage,
//           lastMessageCreatedAt: new Date(),
//         },
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

export const sendRecentChats = async (userId: string) => {
  try {
    if (!userId) {
      console.log("userId required");
      return;
    }
    const chats = await prisma.chat.findMany({
      where: {
        AND: [
          {
            OR: [{ userId1: userId }, { userId2: userId }],
            deleteBy: {
              none: {
                userId: userId,
              },
            },
          },
          {
            deleteBy: {
              none: {
                userId: userId,
              },
            },
          },
        ],
      },
      orderBy: {
        lastMessageCreatedAt: "desc",
      },
      include: {
        user1: true,
        user2: true,
      },
    });

    const formattedChats = chats.map((chat) => {
      const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
      return {
        chatId: chat.id,
        lastMessage: chat.lastMessage,
        lastMessageCreatedAt: chat.lastMessageCreatedAt,
        unreadCount: chat.unreadCount,
        ...otherUser,
      };
    });
    return formattedChats;
  } catch (error) {
    console.log(error);
  }
};

export default app;
