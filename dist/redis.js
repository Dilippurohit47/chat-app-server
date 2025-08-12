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
const redis_1 = require("redis");
const redis = (0, redis_1.createClient)({
    url: "redis://localhost:6379"
});
redis.on("error", (error) => { console.log(error); });
redis.on("connect", () => {
    console.log("Redis is connected to local");
});
redis.on("ready", () => {
    console.log("Redis is ready to use");
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield redis.connect();
}))();
exports.default = redis;
