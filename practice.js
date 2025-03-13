"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
const clientMap = new Map();
let counter = 1;
wss.on("connection", (ws, req) => {
    let clientId = counter++;
    clientMap.set(clientId, ws);
    console.log(clientMap.size);
    ws.send(`you're connected your id is ${clientId} `);
    ws.on("message", (data) => {
        const m = JSON.parse(data);
        if (m.type === "personal-msg") {
            console.log(m.id);
            const user = clientMap.get(Number(m.id));
            if (user) {
                user.send(m.message.toString());
            }
            else {
                console.log("user not found");
            }
            console.log(user);
            ws.send("message sent");
        }
    });
});
server.listen(8000, () => {
    console.log("server is running on 8000");
});
