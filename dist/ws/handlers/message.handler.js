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
exports.messageHandler = void 0;
const helper_1 = require("../../helper");
const messageHandler = (data, ws, wss) => __awaiter(void 0, void 0, void 0, function* () {
    switch (data.type) {
        default:
            (0, helper_1.logWarn)(`Unknown handler type ${data.type}`);
    }
});
exports.messageHandler = messageHandler;
