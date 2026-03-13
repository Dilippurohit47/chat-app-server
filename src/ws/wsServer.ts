import publisher from "../redis/publisher/publisherRedis";
import { WebSocketServer, WebSocket } from "ws";
import { messageRouter } from "./messageRouter"; 
import {  handleConnectionClosed } from "./handlers/close.handler";
import jwt from "jsonwebtoken" 
import { JWT_PASSWORD } from "../utils/helper" 
import cookie from "cookie";

function verifyAccessToken(req) {
 const cookies = cookie.parse(req.headers.cookie || "");
  const refreshToken = cookies["chat-token"];
  const decoded = jwt.verify(refreshToken, JWT_PASSWORD) as { id: string }
  return decoded.id
}

export const registerWebSocketHandlers = (wss: WebSocketServer) => {
  wss.on("connection", async (ws: WebSocket, req) => {
    let connectedUserId = verifyAccessToken(req)
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("message", async (message) => {
  await messageRouter(message,ws, wss , connectedUserId);
    });
    ws.on("close", ()=>{
      handleConnectionClosed(ws,wss)
    })
  })
};
