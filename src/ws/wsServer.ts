import publisher from "../redis/publisher/publisherRedis";
import { WebSocketServer, WebSocket } from "ws";
import { messageRouter } from "./messageRouter"; 
import {  handleConnectionClosed } from "./handlers/close.handler";
import jwt from "jsonwebtoken" 
import { JWT_PASSWORD } from "../utils/helper" 
import cookie from "cookie";

import {usersMap} from "./connectionManager"

function verifyAccessToken(req) {
 const cookies = cookie.parse(req.headers.cookie || "");
  const refreshToken = cookies["chat-token"];
  const decoded = jwt.verify(refreshToken, JWT_PASSWORD) as { id: string }
  return decoded.id
}

let opened = 0;
let closed = 0;
export const registerWebSocketHandlers = (wss: WebSocketServer) => {
  wss.on("connection", async (ws: WebSocket, req) => {
    // let connectedUserId = verifyAccessToken(req)
   opened++;
   const connectedUserId = "load-test-user";
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (message) => { 
  await messageRouter(message,ws, wss , connectedUserId);
    }); 
    ws.on("close", ()=>{
       closed++;
      handleConnectionClosed(ws,wss)
    })


  })
   setInterval(() => {
    console.log({
      active: wss.clients.size,
      opened,
      closed,     
      totalusers:usersMap?.size

    });
  }, 2000);
};
