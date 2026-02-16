import { WebSocket, WebSocketServer } from "ws";
import redis from "../../redis/redis";
import { getAllConnectedUserIds, setUser } from "../connectionManager";
import { PrismaClient } from "@prisma/client";

export const userHandler = async(data ,ws:WebSocket ,wss:WebSocketServer,prisma:PrismaClient) =>{
    switch (data.type){ 
        case "user-info":
        return userInfoHandler(data,ws,wss,prisma)

        default:
            console.warn("Unknown handler type",data.type)
    }    
}

const userInfoHandler = async(data,ws:WebSocket ,wss:WebSocketServer,prisma:PrismaClient)=>{
            const user = await prisma.user.findUnique({
              where: {
                id: data.userId,
              },
            });
    
            if (user) {
              setUser(user.id, ws, user);
    
              const connectedUsers = getAllConnectedUserIds();
              if (connectedUsers.length) {
                await redis.sAdd("online-users", ...connectedUsers);
              }
              wss.clients.forEach((c) => {
                c.send(
                  JSON.stringify({
                    type: "online-users",
                    onlineUsers: connectedUsers,
                  }),
                );
              });
            }
}