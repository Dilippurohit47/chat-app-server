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
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../utils/prisma");
const middlewares_1 = require("../middlewares");
const app = express_1.default.Router();
app.post("/create-group", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, members } = req.body;
        if (!name || members.length < 0) {
            res.status(403).json({
                message: "Missing elements required"
            });
            return;
        }
        const group = yield prisma_1.prisma.group.create({
            data: {
                name: name,
                members: {
                    create: members.map((userId) => ({
                        user: { connect: { id: userId } },
                    })),
                },
            },
        });
        console.log(group);
        res.status(200).json({
            message: "Group Created successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.get("/", middlewares_1.authorizeToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (error) {
    }
}));
exports.default = app;
