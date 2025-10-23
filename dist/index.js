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
const publisherRedis_1 = __importDefault(require("./publisherRedis"));
const subsciberRedis_1 = __importStar(require("./subsciberRedis"));
require("./utils/vector-db");
const app = (0, express_1.default)();
const aiChatBot_1 = require("./routes/aiChatBot");
const vector_db_1 = require("./utils/vector-db");
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
const subscribeToChannel = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, subsciberRedis_1.connectSubscriber)();
});
subscribeToChannel();
app.get("/", (req, res) => {
    res.send("server is live");
});
const subscribe = () => __awaiter(void 0, void 0, void 0, function* () {
    yield subsciberRedis_1.default.subscribe("messages", (msg) => __awaiter(void 0, void 0, void 0, function* () {
        const data = JSON.parse(msg.toString());
        if (data.type === "personal-msg") {
            const receiverId = data.receiverId;
            if (usersMap.has(receiverId)) {
                let { ws } = usersMap.get(receiverId);
                ws.send(JSON.stringify({
                    type: "personal-msg",
                    message: data.message,
                    receiverId: receiverId,
                    senderId: data.senderId,
                    isMedia: data.isMedia || false
                }));
            }
            if (data.senderId || receiverId || data.message) {
                yield (0, messages_2.saveMessage)(data.senderId, receiverId, data.message, data.isMedia);
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
                        senderId: data.message.senderId,
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
                            userId: userId,
                        },
                    },
                    deletedby: {
                        none: {
                            userId: userId,
                        },
                    },
                },
                include: {
                    members: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
            if (groups.length <= 0) {
                const { ws } = usersMap.get(userId);
                if (ws) {
                    ws.send(JSON.stringify({
                        type: "get-groups-ws",
                        groups: [],
                    }));
                }
                return;
            }
            if (groups.length > 0) {
                const userIds = groups
                    .map((group) => { var _a; return (_a = group.members) === null || _a === void 0 ? void 0 : _a.map((user) => user.userId); })
                    .flatMap((id) => id);
                userIds.map((id) => {
                    if (usersMap.has(id)) {
                        const ws = usersMap.get(id).ws;
                        const getPerUserGroup = () => __awaiter(void 0, void 0, void 0, function* () {
                            const group = yield prisma_1.prisma.group.findMany({
                                where: {
                                    members: {
                                        some: {
                                            userId: id,
                                        },
                                    },
                                    deletedby: {
                                        none: {
                                            userId: id,
                                        },
                                    },
                                },
                                include: {
                                    members: {
                                        include: {
                                            user: true,
                                        },
                                    },
                                },
                            });
                            ws.send(JSON.stringify({
                                type: "get-groups-ws",
                                groups: group,
                            }));
                        });
                        getPerUserGroup();
                    }
                });
            }
        }
    }));
});
subscribe();
wss.on("connection", (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    ws.on("message", (m) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        yield publisherRedis_1.default.publish("messages", m.toString());
        const data = JSON.parse(m.toString());
        console.log("data", data);
        if (data.type === "user-info") {
            const user = yield prisma_1.prisma.user.findUnique({
                where: {
                    id: data.userId,
                },
            });
            if (user) {
                usersMap.set(user.id, { ws, userInfo: user });
                const connectedUsers = Array.from(usersMap.keys());
                for (const id of connectedUsers) {
                    // await redis.sAdd("online-users",id)
                }
                const onlineMembers = [];
                wss.clients.forEach((c) => {
                    c.send(JSON.stringify({ type: "online-users", onlineUsers: onlineMembers }));
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
        if (data.type === "typing") {
            const ws = (_b = usersMap.get(data.receiverId)) === null || _b === void 0 ? void 0 : _b.ws;
            if (ws) {
                ws.send(JSON.stringify({
                    type: "user-is-typing",
                    senderId: data.senderId
                }));
            }
        }
        if (data.type === "typing-stop") {
            const ws = (_c = usersMap.get(data.receiverId)) === null || _c === void 0 ? void 0 : _c.ws;
            if (ws) {
                ws.send(JSON.stringify({
                    type: "user-stopped-typing",
                    senderId: data.senderId
                }));
            }
        }
        if (data.type === "get-chatbot-response") {
            const query = data.query;
            const ws = (_d = usersMap.get(data === null || data === void 0 ? void 0 : data.receiverId)) === null || _d === void 0 ? void 0 : _d.ws;
            const personalData = yield (0, vector_db_1.getInfoFromCollection)(query);
            console.log("personal data", personalData);
            const answer = yield (0, aiChatBot_1.getChatBotResponse)(query || "hello", personalData);
            if (ws) {
                ws.send(JSON.stringify({
                    type: "chatbot-reply",
                    answer: answer,
                    receiverId: data.receiverId,
                }));
            }
        }
        if (data.type === "offer") {
            const ws = (_e = usersMap.get(data.receiverId)) === null || _e === void 0 ? void 0 : _e.ws;
            if (ws) {
                ws.send(JSON.stringify({ type: "offer", offer: data.offer }));
            }
        }
        if (data.type === "ice-candidate") {
            console.log("`sending ice candidtate`", data);
            const ws = (_f = usersMap.get(data.receiverId)) === null || _f === void 0 ? void 0 : _f.ws;
            if (ws) {
                ws.send(JSON.stringify({ type: "ice-candidate", candidate: data.candidate }));
            }
        }
        if (data.type === "answer") {
            console.log("answer getted and sending ", data);
            const ws = (_g = usersMap.get(data.receiverId)) === null || _g === void 0 ? void 0 : _g.ws;
            if (ws) {
                ws.send(JSON.stringify({ type: "answer", answer: data.answer }));
                console.log("answer sended");
            }
        }
        if (data.type === "audio-vedio-toggle") {
            console.log("in audio video toggle");
            const ws = (_h = usersMap.get(data.receiverId)) === null || _h === void 0 ? void 0 : _h.ws;
            if (ws) {
                ws.send(JSON.stringify({
                    audio: data.audio,
                    video: data.video,
                    type: "audio-video-toggle"
                }));
            }
        }
        if (data.type === "someone-is-calling") {
            const ws = (_j = usersMap.get(data.callReceiverId)) === null || _j === void 0 ? void 0 : _j.ws;
            console.log(data);
            if (ws) {
                ws.send(JSON.stringify({
                    type: "someone-is-calling",
                    callerData: data.callerData
                }));
            }
        }
        if (data.type === "call-status") {
            if (data.callStatus === "hang-up") {
                console.log("hang ", data);
                const ws = (_k = usersMap.get(data.callReceiverId)) === null || _k === void 0 ? void 0 : _k.ws;
                if (ws) {
                    ws.send(JSON.stringify({
                        type: "client-call-status",
                        callStatus: "hang-up"
                    }));
                }
            }
            if (data.callStatus === "accepted") {
                const ws = (_l = usersMap.get(data.receiverId)) === null || _l === void 0 ? void 0 : _l.ws;
                if (ws) {
                    ws.send(JSON.stringify({
                        type: "client-call-status",
                        callStatus: "accepted"
                    }));
                }
            }
        }
    }));
    ws.on("close", () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = Array.from(usersMap.entries()).find(([id, socket]) => socket.ws === ws)) === null || _a === void 0 ? void 0 : _a[0];
        if (userId) {
            usersMap.delete(userId);
            // await redis.sRem("online-users",userId)
            // const onlineMembers = await redis.sMembers("online-users")
            const onlineMembers = [];
            wss.clients.forEach((c) => {
                c.send(JSON.stringify({ type: "online-users", onlineUsers: onlineMembers }));
            });
        }
    }));
}));
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
