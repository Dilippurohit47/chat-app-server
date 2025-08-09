import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import cors from "cors";
import { prisma } from "./utils/prisma";
import userAuth from "./routes/userAuth";
import Messages, {
  sendRecentChats,
  upsertRecentChats,
} from "./routes/messages";
import Chat from "./routes/chat"
import cookieParser from "cookie-parser";
import { saveMessage } from "./routes/messages";
import awsRoute from "./aws";
import groupRoute from "./routes/group";
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chat-app-client-tawny.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "OPTIONS","DELETE"],
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

app.get("/", (req, res) => {
  res.send("server is live");
});
wss.on("connection", async (ws, req) => {
  ws.on("message", async (m) => {
    const data = JSON.parse(m.toString()); 
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
          })
        );
      }
      if (data.senderId || receiverId || data.message) {
        await saveMessage(data.senderId, receiverId, data.message,data.chatId);
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
    if (data.type === "user-info") {
      const user = await prisma.user.findUnique({
        where: {
          id: data.userId,
        },
      });
      if (user) {
        usersMap.set(user.id, { ws, userInfo: user });
        const onlineUsers = Array.from(usersMap.entries()).map(
          ([userId, userObj]) => ({
            userId,
            ...userObj.userInfo,
          })
        );
        wss.clients.forEach((c) => {
          c.send(
            JSON.stringify({ type: "online-users", onlineUsers: onlineUsers })
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
        if(user.userId === data.message.senderId){ 
          return
        }
        const ws = usersMap.get(user.userId)?.ws;
        if (ws) {
          ws?.send(
            JSON.stringify({
              type: "group-message",
              content: data.message.content,
              senderId:data.message.senderId
            })
          );
        }
      });
    }
    if(data.type === "send-groups"){
      console.log("send groups")
      const userId = data.userId
      const groups = await prisma.group.findMany({
        where:{
          members:{
            every:{
              userId:userId
            }
          }
        }
      })
      ws.send(JSON.stringify({
        type:"get-groups-ws",
        groups:groups
      }))
    }
  });

  ws.on("close", () => {
    const userId = Array.from(usersMap.entries()).find(
      ([id, socket]) => socket.ws === ws
    )?.[0];
    if (userId) {
      usersMap.delete(userId);
      console.log(`User ${userId} removed. Active users: ${usersMap.size}`);
      // sending online users again after removing closed user from user list
      const onlineUsers = Array.from(usersMap.entries()).map(
        ([userId, userObj]) => ({
          userId,
          ...userObj.userInfo,
        })
      );
      wss.clients.forEach((c) => {
        c.send(
          JSON.stringify({ type: "online-users", onlineUsers: onlineUsers })
        );
      });
    }
  });
});

server.listen(8000, () => {
  console.log("Server is running on 8000");
});
