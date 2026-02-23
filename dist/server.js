"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wss = exports.server = void 0;
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
exports.server = http_1.default.createServer(app_1.app);
exports.wss = new ws_1.WebSocketServer({ server: exports.server });
