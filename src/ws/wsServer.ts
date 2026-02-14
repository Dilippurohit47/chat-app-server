import publisher from "../redis/publisher/publisherRedis";
import redis from "../redis/redis";
import { getChatBotResponse } from "../routes/aiChatBot";
import { sendRecentChats } from "../routes/messages";
import { prisma } from "../utils/prisma";
import { getInfoFromCollection } from "../utils/vector-db";
import {
  getAllConnectedUserIds,
  getConnectedEntries,
  getUserSocket,
  removeUserFromConnections,
  setUser,
} from "./connectionManager";
import { WebSocketServer, WebSocket } from "ws";

export const registerWebSocketHandlers = (wss: WebSocketServer) => {
  wss.on("connection", async (ws: WebSocket, req) => {
    ws.isAlive = true;
    ws.on("pong", () => {
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
      if (data.type === "get-recent-chats") {
        const recentChats = await sendRecentChats(data.userId);
        let ws = getUserSocket(data.userId);
        if (!ws) return;
        ws.send(
          JSON.stringify({
            type: "recent-chats",
            chats: recentChats,
          }),
        );
      }

      if (data.type === "get-chatbot-response") {
        const query = data.query;
        const ws = getUserSocket(data?.receiverId);
        const personalData = (await getInfoFromCollection(query)) as string[];
        const answer = await getChatBotResponse(query || "hello", personalData);
        if (ws) {
          ws.send(
            JSON.stringify({
              type: "chatbot-reply",
              answer: answer,
              receiverId: data.receiverId,
            }),
          );
        }
      }
      if (data.type === "offer") {
        const ws = getUserSocket(data.receiverId);
        if (ws) {
          ws.send(JSON.stringify({ type: "offer", offer: data.offer }));
        }
      }
      if (data.type === "ice-candidate") {
        const ws = getUserSocket(data.receiverId);
        if (ws) {
          ws.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: data.candidate,
            }),
          );
        }
      }
      if (data.type === "answer") {
        const ws = getUserSocket(data.receiverId);
        if (ws) {
          ws.send(JSON.stringify({ type: "answer", answer: data.answer }));
        }
      }

      if (data.type === "audio-vedio-toggle") {
        const ws = getUserSocket(data.receiverId);
        if (ws) {
          ws.send(
            JSON.stringify({
              audio: data.audio,
              video: data.video,
              type: "audio-video-toggle",
            }),
          );
        }
      }
      if (data.type === "someone-is-calling") {
        const ws = getUserSocket(data.receiverId);
        if (ws) {
          ws.send(
            JSON.stringify({
              type: "someone-is-calling",
              callerData: data.callerData,
            }),
          );
        }
      }

      if (data.type === "call-status") {
        if (data.callStatus === "hang-up") {
          const ws = getUserSocket(data?.callReceiverId);

          if (ws) {
            ws.send(
              JSON.stringify({
                type: "client-call-status",
                callStatus: "hang-up",
              }),
            );
          }
        }
        if (data.callStatus === "accepted") {
          const ws = getUserSocket(data.receiverId);
          if (ws) {
            ws.send(
              JSON.stringify({
                type: "client-call-status",
                callStatus: "accepted",
              }),
            );
          }
        }
      }
    });

    ws.on("close", async () => {
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
    });
  });
};
