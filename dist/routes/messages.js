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
exports.sendRecentChats = exports.saveMessage = exports.upsertRecentChats = void 0;
const prisma_1 = require("../utils/prisma");
const express_1 = __importDefault(require("express"));
const upsertRecentChats = (userId1, userId2, lastMessage) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let chat = yield prisma_1.prisma.chat.findFirst({
            where: {
                OR: [
                    { userId1: userId1, userId2: userId2 },
                    { userId1: userId2, userId2: userId1 },
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
                    lastMessage: lastMessage,
                    lastMessageCreatedAt: new Date(),
                    unreadCount: {
                        userId: userId2,
                        unreadMessages: (unreadCount === null || unreadCount === void 0 ? void 0 : unreadCount.unreadMessages) != null
                            ? unreadCount.unreadMessages + 1
                            : 1,
                    },
                },
            });
            yield prisma_1.prisma.deletedChat.deleteMany({
                where: {
                    userId: {
                        in: [userId1, userId2]
                    },
                    chatId: chat.id
                }
            });
        }
        else {
            chat = yield prisma_1.prisma.chat.create({
                data: {
                    userId1: userId1,
                    userId2: userId2,
                    lastMessage: lastMessage,
                    lastMessageCreatedAt: new Date(),
                },
            });
        }
        return chat;
    }
    catch (error) {
        console.log(error);
    }
});
exports.upsertRecentChats = upsertRecentChats;
const saveMessage = (senderId, receiverId, content, isMedia) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const chat = yield (0, exports.upsertRecentChats)(senderId, receiverId, content);
        if (!chat)
            return;
        yield prisma_1.prisma.messages.create({
            data: {
                senderId: senderId,
                receiverId: receiverId,
                content: content,
                chatId: chat.id,
                isMedia: isMedia
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
        const chats = yield prisma_1.prisma.chat.findMany({
            where: {
                AND: [
                    {
                        OR: [{ userId1: userId }, { userId2: userId }],
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
    try {
        const { userId, chatId } = req.body;
        const chat = yield prisma_1.prisma.chat.findUnique({
            where: {
                id: chatId,
            },
        });
        const unreadCount = chat === null || chat === void 0 ? void 0 : chat.unreadCount;
        if (unreadCount && unreadCount.userId === userId) {
            yield prisma_1.prisma.chat.update({
                where: {
                    id: chatId,
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
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
// export const upsertRecentChats = async (
//   userId1: string,
//   userId2: string,
//   lastMessage: string
// ) => {
//   try {
//     const chat = await prisma.chat.findFirst({
//       where: {
//         OR: [
//           { userId1: userId1, userId2: userId2 },
//           { userId1: userId2, userId2: userId1 },
//         ],
//       },
//     });
//     if (chat) {
//       await prisma.chat.update({
//         where: {
//           id: chat.id,
//         },
//         data: {
//           lastMessage: lastMessage,
//           lastMessageCreatedAt: new Date(),
//           unreadCount: {
//             userId: userId2,
//             unreadMessages:
//               chat.unreadCount?.unreadMessages != null
//                 ? chat.unreadCount.unreadMessages + 1
//                 : 1,
//           },
//         },
//       });
//     } else {
//       await prisma.chat.create({
//         data: {
//           userId1: userId1,
//           userId2: userId2,
//           lastMessage: lastMessage,
//           lastMessageCreatedAt: new Date(),
//         },
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };
const sendRecentChats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!userId) {
            console.log("userId required");
            return;
        }
        const chats = yield prisma_1.prisma.chat.findMany({
            where: {
                AND: [
                    {
                        OR: [{ userId1: userId }, { userId2: userId }],
                        deleteBy: {
                            none: {
                                userId: userId,
                            },
                        },
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
            },
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
