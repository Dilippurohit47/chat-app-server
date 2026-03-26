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
const bullmq_1 = require("bullmq");
const queueRedis_1 = __importDefault(require("./queueRedis"));
const messages_1 = require("../routes/messages");
new bullmq_1.Worker("message-persistence", (job) => __awaiter(void 0, void 0, void 0, function* () {
    const data = job.data;
    yield (0, messages_1.saveMessage)(data.tempId, data.senderId, data.receiverId, data.isMedia, data.receiverContent, data.senderContent, data.isChatActive);
}), { connection: queueRedis_1.default });
