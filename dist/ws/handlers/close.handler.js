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
exports.handleConnectionClosed = void 0;
const redis_1 = __importDefault(require("../../redis/redis"));
const connectionManager_1 = require("../connectionManager");
const handleConnectionClosed = (ws, wss) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = (0, connectionManager_1.getConnectedEntries)().find(([id, socket]) => socket.ws === ws)) === null || _a === void 0 ? void 0 : _a[0];
    if (userId) {
        (0, connectionManager_1.removeUserFromConnections)(userId);
        yield redis_1.default.sRem("online-users", userId);
        const onlineMembers = yield redis_1.default.sMembers("online-users");
        wss.clients.forEach((c) => {
            c.send(JSON.stringify({
                type: "online-users",
                onlineUsers: onlineMembers,
            }));
        });
    }
});
exports.handleConnectionClosed = handleConnectionClosed;
