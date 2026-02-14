// ws/heartbeat.ts
import { WebSocketServer } from "ws";

export const startWsHeartbeat = (wss: WebSocketServer, intervalMs = 30000) => {
  return setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, intervalMs);
};
