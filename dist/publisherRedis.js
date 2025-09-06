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
const publsiher = (0, redis_1.createClient)({
    url: process.env.REDIS_URL
});
publsiher.on("error", (error) => { console.log(error); });
publsiher.on("connect", () => {
    console.log("Redis is connected to local");
});
publsiher.on("ready", () => {
    console.log("Redis is ready to use");
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield publsiher.connect();
}))();
exports.default = publsiher;
