import publisher from "../redis/publisher/publisherRedis";
import { WebSocketServer, WebSocket } from "ws";
import { messageRouter } from "./messageRouter";
import {  handleConnectionClosed } from "./handlers/close.handler";

export const registerWebSocketHandlers = (wss: WebSocketServer) => {
  wss.on("connection", async (ws: WebSocket, req) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("message", async (message) => {
  await messageRouter(message,ws, wss);
    });
    ws.on("close", ()=>{
      handleConnectionClosed(ws,wss)
    })
  })
};
