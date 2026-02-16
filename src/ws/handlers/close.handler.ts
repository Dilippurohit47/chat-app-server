import type { WebSocket, WebSocketServer } from "ws";
import redis from "../../redis/redis";
import { getConnectedEntries, removeUserFromConnections } from "../connectionManager";

export const handleConnectionClosed = async(ws:WebSocket,wss:WebSocketServer)=>{
        const userId = getConnectedEntries().find(
        ([id, socket]) => socket.ws === ws,
      )?.[0];

      if (userId) {
        removeUserFromConnections(userId);
        await redis.sRem("online-users", userId);
        const onlineMembers = await redis.sMembers("online-users");
        wss.clients.forEach((c) => {
          c.send(
            JSON.stringify({
              type: "online-users",
              onlineUsers: onlineMembers,
            }),
          );
        });
      }
    
}