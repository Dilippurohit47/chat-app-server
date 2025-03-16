"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = require("./utils/prisma");
const userAuth_1 = __importDefault(require("./routes/userAuth"));
const messages_1 = __importDefault(require("./routes/messages"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const messages_2 = require("./routes/messages");
const aws_1 = __importDefault(require("./aws"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "http://localhost:5173", // Allow frontend URL
    credentials: true, // Allow cookies
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
app.use("/user", userAuth_1.default);
app.use("/chat", messages_1.default);
app.use("/aws", aws_1.default);
const usersMap = new Map();
let counter = 1;
wss.on("connection", (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Client connected");
    ws.on("message", (m) => __awaiter(void 0, void 0, void 0, function* () {
        const data = JSON.parse(m.toString());
        if (data.type === "personal-msg") {
            const receiverId = data.receiverId;
            if (usersMap.has(receiverId)) {
                let { ws } = usersMap.get(receiverId);
                ws.send(JSON.stringify({
                    type: "personal-msg",
                    message: data.message,
                    receiverId: receiverId,
                    senderId: data.senderId,
                }));
            }
            if (data.senderId || receiverId || data.message) {
                (0, messages_2.saveMessage)(data.senderId, receiverId, data.message);
            }
        }
        if (data.type === "user-info") {
            const user = yield prisma_1.prisma.user.findUnique({
                where: {
                    id: data.userId,
                },
            });
            if (user) {
                usersMap.set(user.id, { ws, userInfo: user });
                const onlineUsers = Array.from(usersMap.entries()).map(([userId, userObj]) => (Object.assign({ userId }, userObj.userInfo)));
                wss.clients.forEach((c) => {
                    c.send(JSON.stringify({ type: "online-users", onlineUsers: onlineUsers }));
                });
            }
        }
    }));
    ws.on("close", () => {
        var _a;
        const userId = (_a = Array.from(usersMap.entries()).find(([id, socket]) => socket.ws === ws)) === null || _a === void 0 ? void 0 : _a[0];
        if (userId) {
            usersMap.delete(userId);
            console.log(`User ${userId} removed. Active users: ${usersMap.size}`);
            // sending online users again after removing closed user from user list
            const onlineUsers = Array.from(usersMap.entries()).map(([userId, userObj]) => (Object.assign({ userId }, userObj.userInfo)));
            wss.clients.forEach((c) => {
                c.send(JSON.stringify({ type: "online-users", onlineUsers: onlineUsers }));
            });
        }
    });
}));
server.listen(8000, () => {
    console.log("Server is running on 8000");
});
