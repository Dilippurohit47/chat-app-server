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
exports.userHandler = void 0;
const redis_1 = __importDefault(require("../../redis/redis"));
const connectionManager_1 = require("../connectionManager");
const userHandler = (data, ws, wss, prisma) => __awaiter(void 0, void 0, void 0, function* () {
    switch (data.type) {
        case "user-info":
            return userInfoHandler(data, ws, wss, prisma);
        default:
            console.warn("Unknown handler type", data.type);
    }
});
exports.userHandler = userHandler;
const userInfoHandler = (data, ws, wss, prisma) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma.user.findUnique({
        where: {
            id: data.userId,
        },
    });
    if (user) {
        (0, connectionManager_1.setUser)(user.id, ws, user);
        const connectedUsers = (0, connectionManager_1.getAllConnectedUserIds)();
        if (connectedUsers.length) {
            yield redis_1.default.sAdd("online-users", ...connectedUsers);
        }
        wss.clients.forEach((c) => {
            c.send(JSON.stringify({
                type: "online-users",
                onlineUsers: connectedUsers,
            }));
        });
    }
});
