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
exports.connectSubscriber = connectSubscriber;
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
const mockStoreRedis_1 = require("./redis/mockStoreRedis");
dotenv_1.default.config();
let subscriber;
if (process.env.NODE_ENV === "production") {
    subscriber = (0, redis_1.createClient)({
        url: process.env.REDIS_URL
    });
}
else {
    subscriber = mockStoreRedis_1.mockRedisStore;
}
subscriber.on("connect", () => {
    console.log("Subscriber connected");
});
subscriber.on("error", (err) => {
    console.error("Redis Subscriber Error:", err);
});
function connectSubscriber() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!subscriber.isOpen) {
            yield subscriber.connect();
            return;
        }
        return;
    });
}
exports.default = subscriber;
