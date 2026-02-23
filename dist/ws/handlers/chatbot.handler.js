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
exports.chatbotHandler = void 0;
const helper_1 = require("../../helper");
// import { getInfoFromCollection } from "../../infra/vector/vector-db";
const aiChatBot_1 = require("../../routes/aiChatBot");
const connectionManager_1 = require("../connectionManager");
const chatbotHandler = (data, ws) => {
    switch (data.type) {
        case "get-chatbot-response":
            return getChatBotResponseAndSend(data, ws);
        default:
            (0, helper_1.logWarn)(`Unknown handler in chat bot ${data.type}`);
    }
};
exports.chatbotHandler = chatbotHandler;
const getChatBotResponseAndSend = (data, wss) => __awaiter(void 0, void 0, void 0, function* () {
    const query = data.query;
    const ws = (0, connectionManager_1.getUserSocket)(data === null || data === void 0 ? void 0 : data.receiverId);
    // const personalData = (await getInfoFromCollection(query)) as string[];
    const answer = yield (0, aiChatBot_1.getChatBotResponse)(query || "hello", ["Dilip raj Purohit best software engineer"]);
    if (ws) {
        ws.send(JSON.stringify({
            type: "chatbot-reply",
            answer: answer,
            receiverId: data.receiverId,
        }));
    }
});
