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
exports.saveMessage = void 0;
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
        console.log("msg saved");
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
        const { senderId, receiverId } = req.query;
        if (!senderId || !receiverId) {
            return res.status(400).json({ error: "senderId and receiverId are required" });
        }
        // Fetch messages where:
        // - The sender is senderId and receiver is receiverId
        // - OR the sender is receiverId and receiver is senderId
        const messages = yield prisma_1.prisma.messages.findMany({
            where: {
                OR: [
                    { senderId, receiverId }, // Messages sent by senderId to receiverId
                    { senderId: receiverId, receiverId: senderId }, // Messages sent by receiverId to senderId
                ],
            },
            orderBy: {
                createdAt: "asc", // Order messages by creation time (oldest first)
            },
            include: {
                sender: true, // Include sender details
                receiver: true, // Include receiver details
            },
        });
        res.status(200).json(messages);
    }
    catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}));
exports.default = app;
