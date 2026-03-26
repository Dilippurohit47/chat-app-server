"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageQueue = void 0;
const bullmq_1 = require("bullmq");
const queueRedis_1 = __importDefault(require("./queueRedis"));
exports.messageQueue = new bullmq_1.Queue("message-persistence", {
    connection: queueRedis_1.default
});
