"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const messages_1 = __importStar(require("./routes/messages"));
const chat_1 = __importDefault(require("./routes/chat"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const messages_2 = require("./routes/messages");
const aws_1 = __importDefault(require("./aws"));
const group_1 = __importDefault(require("./routes/group"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "https://chat-app-client-tawny.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "OPTIONS", "DELETE"],
}));
app.use((0, cookie_parser_1.default)());
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
app.use("/user", userAuth_1.default);
app.use("/chat", messages_1.default);
app.use("/aws", aws_1.default);
app.use("/group", group_1.default);
app.use("/chat-setting", chat_1.default);
const usersMap = new Map();
app.get("/", (req, res) => {
    res.send("server is live");
});
wss.on("connection", (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    ws.on("message", (m) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
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
                yield (0, messages_2.saveMessage)(data.senderId, receiverId, data.message, data.chatId);
                const senderRecentChats = yield (0, messages_1.sendRecentChats)(data.senderId);
                const receiverRecentChats = yield (0, messages_1.sendRecentChats)(data.receiverId);
                if (usersMap.has(data.senderId)) {
                    let senderWs = usersMap.get(data.senderId).ws;
                    if (senderWs && senderWs.readyState === 1) {
                        senderWs.send(JSON.stringify({
                            type: "recent-chats",
                            chats: senderRecentChats,
                        }));
                    }
                }
                if (usersMap.has(receiverId)) {
                    let receiverWs = usersMap.get(receiverId).ws;
                    if (receiverWs && receiverWs.readyState === 1) {
                        receiverWs.send(JSON.stringify({
                            type: "recent-chats",
                            chats: receiverRecentChats,
                        }));
                    }
                    else {
                        console.log(`❌ WebSocket not open for receiver (${receiverId})`);
                    }
                }
            }
        }
        console.log(data);
        if (data.type === "user-info") {
            const user = yield prisma_1.prisma.user.findUnique({
                where: {
                    id: data.userId,
                },
            });
            console.log("user ", user);
            if (user) {
                usersMap.set(user.id, { ws, userInfo: user });
                const onlineUsers = Array.from(usersMap.entries()).map(([userId, userObj]) => (Object.assign({ userId }, userObj.userInfo)));
                wss.clients.forEach((c) => {
                    c.send(JSON.stringify({ type: "online-users", onlineUsers: onlineUsers }));
                });
            }
        }
        if (data.type === "get-recent-chats") {
            const recentChats = yield (0, messages_1.sendRecentChats)(data.userId);
            (_a = usersMap.get(data.userId)) === null || _a === void 0 ? void 0 : _a.ws.send(JSON.stringify({
                type: "recent-chats",
                chats: recentChats,
            }));
        }
        if (data.type === "group-message") {
            const groupId = data.groupId;
            const groupMembers = yield prisma_1.prisma.group.findFirst({
                where: {
                    id: groupId,
                },
                include: {
                    members: {
                        select: {
                            userId: true,
                        },
                    },
                },
            });
            groupMembers === null || groupMembers === void 0 ? void 0 : groupMembers.members.map((user) => {
                var _a;
                if (user.userId === data.message.senderId) {
                    return;
                }
                const ws = (_a = usersMap.get(user.userId)) === null || _a === void 0 ? void 0 : _a.ws;
                if (ws) {
                    ws === null || ws === void 0 ? void 0 : ws.send(JSON.stringify({
                        type: "group-message",
                        content: data.message.content,
                        senderId: data.message.senderId
                    }));
                }
            });
        }
        if (data.type === "send-groups") {
            const userId = data.userId;
            const groups = yield prisma_1.prisma.group.findMany({
                where: {
                    members: {
                        some: {
                            userId: userId
                        }
                    }
                },
                include: {
                    members: {
                        include: {
                            user: true
                        }
                    }
                }
            });
            ws.send(JSON.stringify({
                type: "get-groups-ws",
                groups: groups
            }));
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
