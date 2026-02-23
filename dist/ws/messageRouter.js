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
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRouter = void 0;
const user_handler_1 = require("./handlers/user.handler");
const chat_handler_1 = require("./handlers/chat.handler");
const call_handler_1 = require("./handlers/call.handler");
const prisma_1 = require("../infra/database/prisma");
const chatbot_handler_1 = require("./handlers/chatbot.handler");
const messageRouter = (data, ws, wss) => __awaiter(void 0, void 0, void 0, function* () {
    switch (data.type) {
        case "user-info":
            return (0, user_handler_1.userHandler)(data, ws, wss, prisma_1.prisma);
        case "get-recent-chats":
            return (0, chat_handler_1.chatHandler)(data, ws, wss);
        case "offer":
        case "answer":
        case "ice-candidate":
        case "audio-vedio-toggle":
        case "someone-is-calling":
        case "call-status":
            return (0, call_handler_1.callHandler)(data);
        case "get-chatbot-response":
            return (0, chatbot_handler_1.chatbotHandler)(data, ws);
        default:
            console.warn("Unknown Ws Handler", data.type);
    }
});
exports.messageRouter = messageRouter;
