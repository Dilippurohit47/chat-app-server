import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import cors from "cors";
import { prisma } from "./utils/prisma";

import userAuth from "./routes/userAuth";
import Messages from "./routes/messages";
import cookieParser from "cookie-parser";
import { saveMessage } from "./routes/messages";
import awsRoute from "./aws";
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Allow frontend URL
    credentials: true, // Allow cookies
  })
);
app.use(express.json());
app.use(cookieParser());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use("/user", userAuth);
app.use("/chat", Messages);
app.use("/aws",awsRoute)

const usersMap = new Map();
let counter = 1;
wss.on("connection", async (ws, req) => {
  console.log("Client connected");
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
      if(data.senderId || receiverId || data.message){
        saveMessage(data.senderId, receiverId, data.message);
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
