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
exports.sendRecentChats = exports.messageAcknowledge = exports.saveMessage = exports.upsertRecentChats = void 0;
const redis_1 = __importDefault(require("../redis/redis"));
const prisma_1 = require("../utils/prisma");
const express_1 = __importDefault(require("express"));
const upsertRecentChats = (senderId, receiverId, receiverContent, senderContent) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let chat = yield prisma_1.prisma.chat.findFirst({
            where: {
                OR: [
                    { senderId: senderId, receiverId: receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            },
        });
        const unreadCount = chat === null || chat === void 0 ? void 0 : chat.unreadCount;
        if (chat) {
            yield prisma_1.prisma.chat.update({
                where: {
                    id: chat.id,
                },
                data: {
                    lastMessageForSender: senderContent,
                    lastMessageForReceiver: receiverContent,
                    senderId: senderId,
                    receiverId: receiverId,
                    lastMessageCreatedAt: new Date(),
                    unreadCount: {
                        userId: receiverId,
                        unreadMessages: (unreadCount === null || unreadCount === void 0 ? void 0 : unreadCount.unreadMessages) != null
                            ? unreadCount.unreadMessages + 1
                            : 1,
                    },
                },
            });
            yield prisma_1.prisma.deletedChat.deleteMany({
                where: {
                    userId: {
                        in: [senderId, receiverId]
                    },
                    chatId: chat.id
                }
            });
        }
        else {
            chat = yield prisma_1.prisma.chat.create({
                data: {
                    senderId: senderId,
                    receiverId: receiverId,
                    lastMessageForSender: senderContent,
                    lastMessageForReceiver: receiverContent,
                    lastMessageCreatedAt: new Date(),
                    unreadCount: {
                        userId: receiverId,
                        unreadMessages: 1
                    },
                },
            });
        }
        return chat;
    }
    catch (error) {
        console.log("error in upserting recent chats", error);
    }
});
exports.upsertRecentChats = upsertRecentChats;
const saveMessage = (senderId, receiverId, isMedia, receiverContent, senderContent) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chat = yield (0, exports.upsertRecentChats)(senderId, receiverId, receiverContent, senderContent);
        if (!chat)
            return { messageSent: false, messageId: null };
        let message = yield prisma_1.prisma.messages.create({
            data: {
                senderId: senderId,
                receiverId: receiverId,
                content: "content",
                chatId: chat.id,
                isMedia: isMedia,
                senderContent: senderContent,
                receiverContent: receiverContent,
            }, select: {
                id: true
            }
        });
        return {
            messageSent: true,
            messageId: message.id
        };
    }
    catch (error) {
        console.log("error in saving message", error);
        return { messageSent: false, messageId: null };
    }
});
exports.saveMessage = saveMessage;
const messageAcknowledge = (_a) => __awaiter(void 0, [_a], void 0, function* ({ chatId, senderId, receiverId }) {
    try {
        if (!chatId)
            return [];
        const updatedMessages = yield prisma_1.prisma.messages.updateMany({
            where: {
                chatId: chatId,
                senderId: senderId,
                receiverId: receiverId,
                status: "sent"
            }, data: {
                status: "seen"
            }
        });
        console.log(updatedMessages);
        return updatedMessages;
    }
    catch (error) {
        console.log("error in updating message acknowledge", error);
        s;
        return [];
    }
});
exports.messageAcknowledge = messageAcknowledge;
const app = express_1.default.Router();
app.get("/get-messages", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderId, receiverId, cursor } = req.query;
        if (typeof receiverId !== "string") {
            res.status(404).json({
                success: false,
                message: "Reciver id should be string"
            });
            return;
        }
        const limit = parseInt(req.query.limit) || 20;
        const cursorObj = cursor ? JSON.parse(cursor) : null;
        if (!senderId || !receiverId) {
            res
                .status(400)
                .json({ error: "senderId and receiverId are required" });
            return;
        }
        const messages = yield prisma_1.prisma.messages.findMany({
            take: limit + 1,
            where: {
                OR: [
                    {
                        OR: [
                            {
                                senderId: senderId,
                                receiverId: receiverId,
                            },
                            {
                                senderId: receiverId,
                                receiverId: senderId,
                            },
                        ],
                        createdAt: {
                            lt: (cursorObj === null || cursorObj === void 0 ? void 0 : cursorObj.createdAt)
                                ? new Date(cursorObj.createdAt)
                                : undefined,
                        },
                    },
                    // Case 2: Same timestamp but older ID (tiebreaker)
                    ...(cursorObj
                        ? [
                            {
                                OR: [
                                    {
                                        senderId: senderId,
                                        receiverId: receiverId,
                                    },
                                    {
                                        senderId: receiverId,
                                        receiverId: senderId,
                                    },
                                ],
                                createdAt: new Date(cursorObj.createdAt),
                                id: { lt: cursorObj.id },
                            },
                        ]
                        : []),
                ].filter(Boolean),
                deletedBy: {
                    none: {
                        userId: receiverId,
                    },
                },
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            include: { sender: true, receiver: true },
        });
        const hasMore = messages.length > limit;
        const messagesToSend = hasMore ? messages.slice(0, limit) : messages;
        const lastMessage = messagesToSend[messagesToSend.length - 1];
        res.status(200).json({
            messages: messagesToSend,
            cursor: hasMore
                ? {
                    createdAt: lastMessage.createdAt,
                    id: lastMessage.id,
                }
                : null,
            hasMore,
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
                    { user1: userId1, user2: userId2 },
                    { user1: userId2, user2: userId1 },
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
                    unreadCount: { userId: "", unreadMessages: 0 },
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
        const cachedChats = yield redis_1.default.get(`user:${userId}:chats`);
        if (cachedChats) {
            res.json({
                chats: cachedChats,
                message: "From Cached redis"
            });
            return;
        }
        const chats = yield prisma_1.prisma.chat.findMany({
            where: {
                AND: [
                    {
                        OR: [{ senderId: userId }, { receiverId: userId }],
                    },
                    {
                        deleteBy: {
                            none: {
                                userId: userId,
                            },
                        },
                    },
                ],
            },
            orderBy: {
                lastMessageCreatedAt: "desc",
            },
            include: {
                user1: true,
                user2: true,
                deleteBy: true,
            },
        });
        const formattedChats = chats.map((chat) => {
            const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
            return Object.assign({ chatId: chat.id, lastMessageForSender: chat.lastMessageForSender, lastMessageForReceiver: chat.lastMessageForReceiver, lastMessageCreatedAt: chat.lastMessageCreatedAt, unreadCount: chat.unreadCount, senderId: chat.senderId, receiverId: chat.receiverId }, otherUser);
        });
        redis_1.default.set(`user:${userId}:chats`, JSON.stringify(formattedChats), {
            EX: 60 * 10
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
    try {
        const { senderId, chatId, receiverId } = req.body;
        let chat;
        if (chatId) {
            chat = yield prisma_1.prisma.chat.findUnique({
                where: {
                    id: chatId,
                },
            });
        }
        if (!chatId) {
            chat = yield prisma_1.prisma.chat.findFirst({
                where: {
                    senderId: senderId,
                    receiverId: receiverId,
                }
            });
        }
        const unreadCount = chat === null || chat === void 0 ? void 0 : chat.unreadCount;
        if (unreadCount && unreadCount.userId === receiverId) {
            yield prisma_1.prisma.chat.update({
                where: {
                    id: chatId || chat.id,
                },
                data: {
                    unreadCount: {
                        userId: null,
                        unreadMessages: 0,
                    },
                },
            });
        }
        res.status(200).json({
            message: "Unread message count updated successfully",
        });
    }
    catch (error) {
        console.log("error in updating unread count", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
const sendRecentChats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!userId) {
            return;
        }
        const chats = yield prisma_1.prisma.chat.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
                deleteBy: {
                    none: { userId },
                },
            },
            orderBy: {
                lastMessageCreatedAt: "desc",
            },
            include: {
                user1: true,
                user2: true,
            },
        });
        const formattedChats = chats.map((chat) => {
            const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
            return Object.assign({ chatId: chat.id, lastMessageForReceiver: chat.lastMessageForReceiver, lastMessageForSender: chat.lastMessageForSender, senderId: chat.senderId, receiverId: chat.receiverId, lastMessageCreatedAt: chat.lastMessageCreatedAt, unreadCount: chat.unreadCount }, otherUser);
        });
        return formattedChats;
    }
    catch (error) {
        console.log("error in send recent chats ", error);
    }
});
exports.sendRecentChats = sendRecentChats;
exports.default = app;
