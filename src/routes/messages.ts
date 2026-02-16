import { verifyAccessToken } from "../middlewares/VerifyAccessToken";
import redis from "../redis/redis";
import { prisma } from "../infra/database/prisma";
import express, { Request, Response } from "express";
 export const upsertRecentChats = async (
  senderId: string,
  receiverId: string,
  receiverContent: string,
  senderContent:string
) => {
  try {
    let chat = await prisma.chat.findFirst({
      where: {
        OR: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
 
    const unreadCount = chat?.unreadCount as {unreadMessages : number}

    if (chat) {
      await prisma.chat.update({
        where: {
          id: chat.id,
        },
        data: {
          lastMessageForSender:senderContent,
          lastMessageForReceiver:receiverContent,
          senderId:senderId,
          receiverId:receiverId,
          lastMessageCreatedAt: new Date(),
          unreadCount: {
            userId: receiverId,
            unreadMessages:
              unreadCount?.unreadMessages != null
                ? unreadCount.unreadMessages + 1
                : 1,
          },
        },
      });

      await prisma.deletedChat.deleteMany({
        where:{ 
          userId:{
            in:[senderId,receiverId]
          },
          chatId:chat.id
        }
      })
    } else {  
    chat =  await prisma.chat.create({
        data: {
          senderId: senderId,
          receiverId: receiverId,
          lastMessageForSender: senderContent,
          lastMessageForReceiver:receiverContent,
          lastMessageCreatedAt: new Date(),
            unreadCount: {
            userId: receiverId,
            unreadMessages:1
          },
        }, 
      });
    }
    return chat
  } catch (error) {
    console.log("error in upserting recent chats",error);
  }
};
export const saveMessage = async (
  tempId:string,
  senderId: string,
  receiverId: string,
  isMedia:boolean,
  receiverContent:string,
  senderContent:string,
) => {
  try { 
 
const chat  = await upsertRecentChats(senderId,receiverId,receiverContent ,senderContent)
if(!chat) return  {messageSent:false , messageId:null}
let message = await prisma.messages.create({
      data: {
        id:tempId,
        senderId: senderId,
        receiverId: receiverId,
        content: "content",
        chatId: chat.id,
        isMedia:isMedia,
        senderContent:senderContent,
        receiverContent:receiverContent,
      },select:{
        id:true
      }
    });
    return {
      messageSent:true,
      messageId:message.id
    };
  } catch (error) {
    console.log("error in saving message",error);
    return {messageSent:false,messageId:null};
  }
};

export const messageAcknowledge = async({chatId ,senderId ,receiverId}:{chatId:string , senderId:string ,receiverId:string})=>{
try {
    if(!chatId) return []
const updatedMessages = await prisma.$transaction(async (tx) => {
  // 1. Get messages first
  const messages = await tx.messages.findMany({
    where: {
      chatId,
      senderId,
      receiverId,
      status: "sent",
    },
  });
  // 2. Update them
  await tx.messages.updateMany({
    where: {
      chatId,
      senderId,
      receiverId,
      status: "sent",
    },
    data: {
      status: "seen",
    },
  });

  // 3. Return previously fetched messages (now logically "seen")
  return messages.map(m => ({ ...m, status: "seen" }));
});

  return updatedMessages
} catch (error) {
  console.log("error in updating message acknowledge",error)
  return []
}

}

const app = express.Router();

interface getMessagesBody {
  senderId:string,
  receiverId:string,
  cursor:string
}

app.get("/get-messages", async (req: Request<{},{},getMessagesBody>, res: Response) => {
  try {
    const { senderId, receiverId, cursor } = req.query;

   if(typeof receiverId !== "string"){
    res.status(404).json({
      success:false,
      message:"Reciver id should be string"
    })
    return
   }
    const limit = parseInt(req.query.limit as string) || 20;
    const cursorObj = cursor ? JSON.parse(cursor as string) : null;
    if (!senderId || !receiverId) {
       res
        .status(400)
        .json({ error: "senderId and receiverId are required" });
        return
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
            userId: senderId,
          },
        }, 
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { sender: true, receiver: true ,deletedBy:true},
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
          { user1: userId1, user2: userId2 },
          { user1: userId2, user2: userId1 },
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

app.get("/get-recent-chats",verifyAccessToken, async (req, res) => {
  try {
    const userId = req.user.id as string;

    if (!userId) {
      res.status(404).json({
        message: "Login first",
      });
      return;
    } 

    const cachedChats = await redis.get(`user:${userId}:chats`)
    if(cachedChats){
        res.json({
      chats: cachedChats,
      message:"From Cached redis"
    });
      return
    }

    const chats = await prisma.chat.findMany({
      where: {
        AND: [
          {
            OR: [{ senderId: userId }, { receiverId: userId }],
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
        lastMessageForSender: chat.lastMessageForSender,
        lastMessageForReceiver: chat.lastMessageForReceiver,
        lastMessageCreatedAt: chat.lastMessageCreatedAt,
        unreadCount: chat.unreadCount,
        senderId:chat.senderId,
        receiverId:chat.receiverId,
        ...otherUser,
      };
    });

    redis.set( `user:${userId}:chats`,JSON.stringify(formattedChats),{
      EX:60*10
    })

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
 

interface DeleteChatBody {
  senderId:string,
  receiverId:string,
  chatId:string,
}
app.put("/update-unreadmessage-count", async (req:Request<{},{},DeleteChatBody>, res:Response) => {
  try { 
    const { senderId, chatId , receiverId } = req.body;
    let chat ;
    if(chatId){
chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
    });
      
    } 
    
    if(!chatId){
      chat = await  prisma.chat.findFirst({
        where:{
          senderId:senderId,
          receiverId:receiverId,  
        }
      }) }

    const unreadCount = chat?.unreadCount as {userId:string} | null
    if ( unreadCount && unreadCount.userId === receiverId) {
      await prisma.chat.update({
        where: {
          id: chatId || chat.id,
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
    console.log("error in updating unread count",error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});


export const sendRecentChats = async (userId: string) => {
  try {  
    if (!userId) { 
      return;
    }
    const chats = await prisma.chat.findMany({
  where: {
  OR: [{ senderId: userId }, { receiverId: userId }],
  deleteBy: {
    none: { userId },
  },
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
        lastMessageForReceiver: chat.lastMessageForReceiver,
        lastMessageForSender: chat.lastMessageForSender,
        senderId:chat.senderId,
        receiverId:chat.receiverId,
        lastMessageCreatedAt: chat.lastMessageCreatedAt,
        unreadCount: chat.unreadCount,
        ...otherUser,
      };
    });
    return formattedChats;
  } catch (error) {
    console.log("error in send recent chats ",error);
  }
};

export default app;
