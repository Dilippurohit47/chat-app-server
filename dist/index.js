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
const subsciberRedis_1 = require("./redis/subscriber/subsciberRedis");
const wsServer_1 = require("./ws/wsServer");
const startWsHearBeat_1 = require("./ws/startWsHearBeat");
const server_1 = require("./server");
require("./infra/vector/vector-db");
process.on("unhandledRejection", (reason, promise) => {
    console.error("🔥 Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
});
const PORT = process.env.PORT || 8080;
const bootstrap = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, subsciberRedis_1.connectSubscriber)();
        yield (0, subsciberRedis_1.startRedisSubscriber)();
        (0, wsServer_1.registerWebSocketHandlers)(server_1.wss);
        (0, startWsHearBeat_1.startWsHeartbeat)(server_1.wss);
        server_1.server.listen(PORT, () => {
            console.log(`Server is running on ${PORT}`);
        });
    }
    catch (err) {
        console.error("Startup failed", err);
        process.exit(1);
    }
});
bootstrap();
