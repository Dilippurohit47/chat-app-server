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
exports.sendRecentChats = exports.upsertRecentChats = exports.saveMessage = void 0;
const prisma_1 = require("../utils/prisma");
const express_1 = __importDefault(require("express"));
const saveMessage = (senderId, receiverId, content) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.prisma.messages.create({
            data: {
                senderId: senderId,
                receiverId: receiverId,
                content: content,
            },
        });
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
});
exports.saveMessage = saveMessage;
const app = express_1.default.Router();
app.get("/get-messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderId, receiverId, cursor } = req.query;
        const limit = parseInt(req.query.limit) || 20;
        const cursorObj = cursor ? JSON.parse(cursor) : null;
        console.log("logs", senderId, receiverId, cursor);
        if (!senderId || !receiverId) {
            return res.status(400).json({ error: "senderId and receiverId are required" });
        }
        const messages = yield prisma_1.prisma.messages.findMany({
            take: limit + 1,
            where: {
                OR: [
                    {
                        OR: [
                            { senderId: senderId, receiverId: receiverId },
                            { senderId: receiverId, receiverId: senderId },
                        ],
                        createdAt: { lt: (cursorObj === null || cursorObj === void 0 ? void 0 : cursorObj.createdAt) ? new Date(cursorObj.createdAt) : undefined }
                    },
                    // Case 2: Same timestamp but older ID (tiebreaker)
                    ...(cursorObj ? [{
                            OR: [
                                { senderId: senderId, receiverId: receiverId },
                                { senderId: receiverId, receiverId: senderId },
                            ],
                            createdAt: new Date(cursorObj.createdAt),
                            id: { lt: cursorObj.id }
                        }] : [])
                ].filter(Boolean) // Remove empty conditions if no cursor
            },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            include: { sender: true, receiver: true }
        });
        const hasMore = messages.length > limit;
        const messagesToSend = hasMore ? messages.slice(0, limit) : messages;
        const lastMessage = messagesToSend[messagesToSend.length - 1];
        res.status(200).json({
            messages: messagesToSend,
            cursor: hasMore ? {
                createdAt: lastMessage.createdAt,
                id: lastMessage.id
            } : null,
            hasMore
        });
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
app.post("/create-chats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId1, userId2, lastMessage } = req.body;
        const chat = yield prisma_1.prisma.chat.findFirst({
            where: {
                OR: [
                    { userId1: userId1, userId2: userId2 },
                    { userId1: userId2, userId2: userId1 },
                ],
            },
        });
        if (chat) {
            yield prisma_1.prisma.chat.update({
                where: {
                    id: chat.id,
                },
                data: {
                    lastMessage: lastMessage,
                    lastMessageCreatedAt: new Date()
                },
            });
        }
        else {
            yield prisma_1.prisma.chat.create({
                data: {
                    userId1: userId1,
                    userId2: userId2,
                    lastMessage: lastMessage,
                    lastMessageCreatedAt: new Date(),
                    unreadCount: { userId: "", unreadMessages: 0 }
                },
            });
        }
        res.json({
            message: "Chat created",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
}));
app.get("/get-recent-chats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(404).json({
                message: "Login first",
            });
            return;
        }
        const chats = yield prisma_1.prisma.chat.findMany({
            where: {
                OR: [{ userId1: userId }, { userId2: userId }],
            },
            orderBy: {
                lastMessageCreatedAt: "desc",
            },
            include: {
                user1: true,
                user2: true,
            }
        });
        const formattedChats = chats.map((chat) => {
            const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
            return Object.assign({ chatId: chat.id, lastMessage: chat.lastMessage, lastMessageCreatedAt: chat.lastMessageCreatedAt, unreadCount: chat.unreadCount }, otherUser);
        });
        res.json({
            chats: formattedChats,
        });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.put("/update-unreadmessage-count", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId, chatId } = req.body;
        const chat = yield prisma_1.prisma.chat.findUnique({
            where: {
                id: chatId
            }
        });
        if (((_a = chat === null || chat === void 0 ? void 0 : chat.unreadCount) === null || _a === void 0 ? void 0 : _a.userId) === userId) {
            yield prisma_1.prisma.chat.update({
                where: {
                    id: chatId
                },
                data: {
                    unreadCount: {
                        userId: null,
                        unreadMessages: 0
                    }
                }
            });
        }
        res.status(200).json({
            message: "Unread message count updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}));
const upsertRecentChats = (userId1, userId2, lastMessage) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const chat = yield prisma_1.prisma.chat.findFirst({
            where: {
                OR: [
                    { userId1: userId1, userId2: userId2 },
                    { userId1: userId2, userId2: userId1 },
                ],
            },
        });
        if (chat) {
            yield prisma_1.prisma.chat.update({
                where: {
                    id: chat.id,
                },
                data: {
                    lastMessage: lastMessage,
                    lastMessageCreatedAt: new Date(),
                    unreadCount: {
                        userId: userId2,
                        unreadMessages: ((_a = chat.unreadCount) === null || _a === void 0 ? void 0 : _a.unreadMessages) != null ? chat.unreadCount.unreadMessages + 1 : 1
                    }
                },
            });
        }
        else {
            yield prisma_1.prisma.chat.create({
                data: {
                    userId1: userId1,
                    userId2: userId2,
                    lastMessage: lastMessage,
                    lastMessageCreatedAt: new Date()
                },
            });
        }
    }
    catch (error) {
        console.log(error);
    }
});
exports.upsertRecentChats = upsertRecentChats;
const sendRecentChats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!userId) {
            console.log("userId required");
            return;
        }
        const chats = yield prisma_1.prisma.chat.findMany({
            where: {
                OR: [{ userId1: userId }, { userId2: userId }],
            },
            orderBy: {
                lastMessageCreatedAt: "desc",
            },
            include: {
                user1: true,
                user2: true,
            }
        });
        const formattedChats = chats.map((chat) => {
            const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
            return Object.assign({ chatId: chat.id, lastMessage: chat.lastMessage, lastMessageCreatedAt: chat.lastMessageCreatedAt, unreadCount: chat.unreadCount }, otherUser);
        });
        return formattedChats;
    }
    catch (error) {
        console.log(error);
    }
});
exports.sendRecentChats = sendRecentChats;
exports.default = app;
