import { WebSocketServer } from "ws";
import http from "http"
import { app } from "./app";

export const server = http.createServer(app);
export const wss = new WebSocketServer({ server });  
