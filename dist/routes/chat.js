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
const prisma_1 = require("../infra/database/prisma");
const VerifyAccessToken_1 = require("../middlewares/VerifyAccessToken");
const app = express_1.default.Router();
app.delete("/clear-chat/:id", VerifyAccessToken_1.verifyAccessToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const chatId = (_b = req.params) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId || !chatId) {
            res.status(403).json({
                message: "Missing fields required"
            });
            return;
        }
        const messages = yield prisma_1.prisma.messages.findMany({
            where: { chatId: chatId },
            select: { id: true },
        });
        yield prisma_1.prisma.deletedMessage.createMany({
            data: messages.map((msg) => ({
                userId: userId,
                messageId: msg.id,
            })),
            skipDuplicates: true,
        });
        res.status(200).json({
            message: "Chat clear"
        });
        return;
    }
    catch (error) {
        console.log("error while deleting chat", error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
}));
app.delete("/delete-chat/:id", VerifyAccessToken_1.verifyAccessToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const chatId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId || !chatId) {
            res.status(403).json({
                message: "Missing fields required"
            });
            return;
        }
        yield prisma_1.prisma.deletedChat.create({
            data: {
                chatId: chatId,
                userId: userId,
            },
        });
        res.status(200).json({
            message: "Deleted successfully"
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server Error"
        });
    }
}));
exports.default = app;
