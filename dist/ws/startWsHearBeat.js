"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWsHeartbeat = void 0;
const startWsHeartbeat = (wss, intervalMs = 30000) => {
    return setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                ws.terminate();
                return;
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, intervalMs);
};
exports.startWsHeartbeat = startWsHeartbeat;
