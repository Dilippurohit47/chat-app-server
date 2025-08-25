import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import cors from "cors";
import { prisma } from "./utils/prisma";
import userAuth from "./routes/userAuth";
import redis from "./redis/redis";
import Messages, {
  sendRecentChats,
} from "./routes/messages";
import Chat from "./routes/chat";
import cookieParser from "cookie-parser";
import { saveMessage } from "./routes/messages";
import awsRoute from "./aws";
import groupRoute from "./routes/group";
import publisher from "./publisherRedis";
import subscriber, { connectSubscriber } from "./subsciberRedis";
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "https://chat-app-client-tawny.vercel.app",
    ], 
    credentials: true,
    methods: ["GET", "POST", "PUT", "OPTIONS", "DELETE"],
  })
);
app.use(cookieParser());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use("/user", userAuth);
app.use("/chat", Messages);
app.use("/aws", awsRoute);
app.use("/group", groupRoute);
app.use("/chat-setting", Chat);
const usersMap = new Map();

const subscribeToChannel = async () => {
  await connectSubscriber();
};
subscribeToChannel(); 

app.get("/", (req, res) => {
  res.send("server is live");
});

const subscribe = async () => {
  await subscriber.subscribe("messages", async (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.type === "personal-msg") {
      const receiverId = data.receiverId;

      if (usersMap.has(receiverId)) {
        let { ws } = usersMap.get(receiverId);
        ws.send(
          JSON.stringify({
            type: "personal-msg",
            message: data.message,
            receiverId: receiverId,
            senderId: data.senderId,
            isMedia:data.isMedia || false
          })
        );
      }
      if (data.senderId || receiverId || data.message) {
        await saveMessage(data.senderId, receiverId, data.message, data.isMedia);
        const senderRecentChats = await sendRecentChats(data.senderId);
        const receiverRecentChats = await sendRecentChats(data.receiverId);

        if (usersMap.has(data.senderId)) {
          let senderWs = usersMap.get(data.senderId).ws;
          if (senderWs && senderWs.readyState === 1) {
            senderWs.send(
              JSON.stringify({
                type: "recent-chats",
                chats: senderRecentChats,
              })
            );
          }
        }

        if (usersMap.has(receiverId)) {
          let receiverWs = usersMap.get(receiverId).ws;
          if (receiverWs && receiverWs.readyState === 1) {
            receiverWs.send(
              JSON.stringify({
                type: "recent-chats",
                chats: receiverRecentChats,
              })
            );
          } else {
            console.log(`❌ WebSocket not open for receiver (${receiverId})`);
          }
        }
      }
    }
    if (data.type === "group-message") {
      const groupId = data.groupId;
      const groupMembers = await prisma.group.findFirst({
        where: {
          id: groupId,
        },
        include: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      });
      groupMembers?.members.map((user) => {
        if (user.userId === data.message.senderId) {
          return;
        }
        const ws = usersMap.get(user.userId)?.ws;
        if (ws) {
          ws?.send(
            JSON.stringify({
              type: "group-message",
              content: data.message.content,
              senderId: data.message.senderId,
            })
          );
        }
      });
    }
    if (data.type === "send-groups") {
      const userId = data.userId;
      const groups = await prisma.group.findMany({
        where: {
          members: {
            some: {
              userId: userId,
            },
          },
          deletedby: {
            none: {
              userId: userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });
      if (groups.length <= 0) {
        const { ws } = usersMap.get(userId);
        if (ws) {
          ws.send(
            JSON.stringify({
              type: "get-groups-ws",
              groups: [],
            })
          );
        }
        return;
      }
      if (groups.length > 0) {
        const userIds = groups
          .map((group) => group.members?.map((user) => user.userId))
          .flatMap((id) => id);
        userIds.map((id) => {
          if (usersMap.has(id)) {
            const ws = usersMap.get(id).ws;
            const getPerUserGroup = async () => {
              const group = await prisma.group.findMany({
                where: {
                  members: {
                    some: {
                      userId: id,
                    },
                  },
                  deletedby: {
                    none: {
                      userId: id,
                    },
                  },
                },
                include: {
                  members: {
                    include: {
                      user: true,
                    },
                  },
                },
              });
              ws.send(
                JSON.stringify({
                  type: "get-groups-ws",
                  groups: group,
                })
              );
            };
            getPerUserGroup();
          }
        });
      }
    }
  });
};
subscribe();

wss.on("connection", async (ws, req) => {
  ws.on("message", async (m) => {
    await publisher.publish("messages", m.toString());
    const data = JSON.parse(m.toString());
    if (data.type === "user-info") {
      const user = await prisma.user.findUnique({
        where: {
          id: data.userId,
        }, 
      });


      if (user) {
        usersMap.set(user.id, { ws, userInfo: user });
        const onlineUsers = Array.from(usersMap.entries()).map(
          async([userId, userObj]) => { 
            await redis.sAdd("online-users", userId);
            return {
              userId,
              ...userObj.userInfo,
            };
          }
        );

        const onlineMembers = await redis.sMembers("online-users")

        wss.clients.forEach((c) => {
          c.send(
            JSON.stringify({ type: "online-users", onlineUsers: onlineMembers })
          );
        });
      }
    }
    if (data.type === "get-recent-chats") {
      const recentChats = await sendRecentChats(data.userId);
      usersMap.get(data.userId)?.ws.send(
        JSON.stringify({
          type: "recent-chats",
          chats: recentChats,
        })
      );
    }
    if(data.type === "typing"){
      const ws = usersMap.get(data.receiverId)?.ws
      if(ws){
        ws.send(JSON.stringify({
          type:"user-is-typing",
          senderId:data.senderId
        }))
      }
    }
    if(data.type === "typing-stop"){
      const ws = usersMap.get(data.receiverId)?.ws
      if(ws){
        ws.send(JSON.stringify({
          type:"user-stopped-typing",
          senderId:data.senderId
        }))
      }
    }
  });

  ws.on("close",async () => {
    const userId = Array.from(usersMap.entries()).find(
      ([id, socket]) => socket.ws === ws
    )?.[0];
    if (userId) {
      usersMap.delete(userId);
      await redis.sRem("online-users",userId)
      const onlineMembers = await redis.sMembers("online-users")
      wss.clients.forEach((c) => {
        c.send(
          JSON.stringify({ type: "online-users", onlineUsers: onlineMembers })
        );
      });
    }
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log("Server is running on 8000"); 
});
