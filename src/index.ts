import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import cors from "cors";
import { prisma } from "./utils/prisma";
import userAuth from "./routes/userAuth";
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
import "./utils/vector-db"
import rateLimit from "express-rate-limit";
const app = express(); 
import {getChatBotResponse} from  "./routes/aiChatBot"
import { getInfoFromCollection } from "./utils/vector-db";
import redis from "./redis/redis";
process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});
app.use(express.json());
app.set("trust proxy", 1);
app.use( 
  cors({
    origin: [ 
      "http://localhost:5173",  
      "https://chat-app-client-tawny.vercel.app",
      "https://track-habits.xyz"
    ],    
    credentials: true,
    methods: ["GET", "POST", "PUT", "OPTIONS", "DELETE"],
  })
);
app.use(cookieParser());
const server = http.createServer(app);
const wss = new WebSocketServer({ server });  


const apiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100 , 
  message: "Too many requests, slow down!",
});




app.use("/user", apiLimiter ,  userAuth); 
app.use("/chat",apiLimiter , Messages); 
app.use("/aws",apiLimiter , awsRoute);
app.use("/group",apiLimiter, groupRoute);
app.use("/chat-setting",apiLimiter, Chat); 
const usersMap = new Map();
 
const subscribeToChannel = async () => { 
  await connectSubscriber();    
};

subscribeToChannel();     
app.get("/", (req, res) => {  
  res.send("server is live by ci/cd pipelines v1");
});


const subscribe = async () => {
  await subscriber.subscribe("messages", async (msg) => {
    const data = JSON.parse(msg.toString());

    if (data.type === "ping") return;
    if (data.type === "personal-msg") {
      const receiverId = data.receiverId;
   
      if (usersMap.has(receiverId)) {
        let { ws } = usersMap.get(receiverId);
        ws.send(
          JSON.stringify({
            type: "personal-msg",
            receiverContent: data.receiverContent,
            senderContent: data.senderContent,
            receiverId: receiverId, 
            senderId: data.senderId, 
            isMedia:data.isMedia || false
          })
        );
      }
      if (data.senderId || receiverId || data.message) {
        await saveMessage(data.senderId, receiverId, data.message, data.isMedia ,data.receiverContent ,data.senderContent);
        const senderRecentChats = await sendRecentChats(data.senderId);
        const receiverRecentChats = await sendRecentChats(data.receiverId);
        if(senderRecentChats){
  redis.set( `user:${data.senderId}:chats`,JSON.stringify(senderRecentChats),{
              EX:60*10
            })
        }
        if(receiverRecentChats){
          
         redis.set( `user:${data.receiverId}:chats`,JSON.stringify(receiverRecentChats), { 
              EX:60*10 
            })
        }
       
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

setInterval(() => {
  wss.clients.forEach((ws) => {
    // @ts-ignore
    if (!ws.isAlive) {
      ws.terminate();
      return;
    }
    // @ts-ignore
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("connection", async (ws, req) => {
  console.log("✅ client connected, total:", process.env.PORT);
// @ts-ignore
  ws.isAlive = true;  
  ws.on("pong", () => {
// @ts-ignore
  ws.isAlive = true;
  });


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
  
        const connectedUsers= Array.from(usersMap.keys())
for(const id of connectedUsers){ 
          await redis.sAdd("online-users",id)
}
        // const onlineMembers = []
        wss.clients.forEach((c) => {
          c.send(
            JSON.stringify({ type: "online-users", onlineUsers: connectedUsers  })
          );
        });
      }
    }
    if (data.type === "get-recent-chats") {
      const recentChats = await sendRecentChats(data.userId);
      usersMap.get(data.userId)?.ws.send(
        JSON.stringify({
          type: "recent-chats",
          chats:recentChats,
        })
      );
    }
 

    if(data.type === "get-chatbot-response"){
      const query = data.query
      const ws = usersMap.get(data?.receiverId)?.ws
      const personalData = await getInfoFromCollection(query) as string[]
      const answer = await getChatBotResponse(query || "hello",personalData)
      if(ws){
        console.log("answer chatbot -",answer )
        ws.send(JSON.stringify({
          type:"chatbot-reply",
          answer:answer,
          receiverId:data.receiverId,

        }))
      }
    } 
    if(data.type === "offer"){
      const ws = usersMap.get(data.receiverId)?.ws
      if(ws){
        ws.send(JSON.stringify({type:"offer",offer:data.offer}))
      }
    }
    if(data.type === "ice-candidate"){
      const ws = usersMap.get(data.receiverId)?.ws
      if(ws){
        ws.send(JSON.stringify({type:"ice-candidate",candidate:data.candidate}))
      }
    }
    if (data.type === "answer") {
  const ws = usersMap.get(data.receiverId)?.ws; 
  if (ws) {
    ws.send(JSON.stringify({ type: "answer", answer: data.answer })); 

  }
}

if(data.type === "audio-vedio-toggle"){ 
  const ws = usersMap.get(data.receiverId)?.ws
  if(ws){
    ws.send(JSON.stringify({
      audio:data.audio,
      video:data.video,
      type:"audio-video-toggle"
    }))
  }
}
if(data.type === "someone-is-calling"){
  const ws = usersMap.get(data.callReceiverId)?.ws
  if(ws){
    ws.send(JSON.stringify({
      type:"someone-is-calling",
      callerData:data.callerData
    }))
  }
}

if(data.type === "call-status"){
  if(data.callStatus === "hang-up"){
const ws = usersMap.get(data.callReceiverId)?.ws
if(ws){
      ws.send(JSON.stringify({
      type:"client-call-status",
      callStatus:"hang-up"
    }))
}
  }
  if(data.callStatus === "accepted"){
const ws = usersMap.get(data.receiverId)?.ws 
if(ws){
  ws.send(JSON.stringify({
    type:"client-call-status", 
    callStatus:"accepted"
  }))
}
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

const PORT = process.env.PORT  || 8080;

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);  
});
  