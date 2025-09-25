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
exports.mockRedisStore = void 0;
const mockStore = new Map();
exports.mockRedisStore = {
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
