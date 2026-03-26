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
exports.registerWebSocketHandlers = void 0;
const messageRouter_1 = require("./messageRouter");
const close_handler_1 = require("./handlers/close.handler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helper_1 = require("../utils/helper");
const cookie_1 = __importDefault(require("cookie"));
function verifyAccessToken(req) {
    const cookies = cookie_1.default.parse(req.headers.cookie || "");
    const refreshToken = cookies["chat-token"];
    const decoded = jsonwebtoken_1.default.verify(refreshToken, helper_1.JWT_PASSWORD);
    return decoded.id;
}
const registerWebSocketHandlers = (wss) => {
    wss.on("connection", (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
        let connectedUserId = verifyAccessToken(req);
        ws.isAlive = true;
        ws.on("pong", () => {
            ws.isAlive = true;
        });
        ws.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, messageRouter_1.messageRouter)(message, ws, wss, connectedUserId);
        }));
        ws.on("close", () => {
            (0, close_handler_1.handleConnectionClosed)(ws, wss);
        });
    }));
};
exports.registerWebSocketHandlers = registerWebSocketHandlers;
