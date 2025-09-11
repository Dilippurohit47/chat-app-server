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
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let redis;
if (process.env.NODE_ENV === "production") {
    redis = (0, redis_1.createClient)({
        url: process.env.REDIS_URL,
    });
}
else {
    const mockStore = new Map();
    redis = {
        get: (k) => __awaiter(void 0, void 0, void 0, function* () { return mockStore.get(k); }),
        set: (k, v) => __awaiter(void 0, void 0, void 0, function* () {
            mockStore.set(k, v);
            return "OK";
        }),
        publish: (ch, msg) => __awaiter(void 0, void 0, void 0, function* () { return console.log(`[MockPub] ${ch}: ${msg}`); }),
        subscribe: (ch, cb) => __awaiter(void 0, void 0, void 0, function* () { return console.log(`[MockSub] ${ch}`); }),
        on: () => { },
        connect: () => __awaiter(void 0, void 0, void 0, function* () { }),
        quit: () => __awaiter(void 0, void 0, void 0, function* () { }),
    };
}
redis.on("error", (error) => {
    console.log("Error in main redis", error);
});
redis.on("ready", () => {
    console.log("main Redis is ready to use");
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield redis.connect();
}))();
exports.default = redis;
