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
        if (!name || members.length <= 0) {
            res.status(403).json({
                message: "Missing elements required",
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
        const userId = req.user.id;
        const groups = yield prisma_1.prisma.group.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        res.status(200).json({
            groups: groups,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
}));
app.post("/add-new-members", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { newMembers } = req.body;
        const { groupId } = req.query;
        if (!groupId) {
            res.status(403).json({
                message: "Group id is absent!",
            });
        }
        const data = yield prisma_1.prisma.group.update({
            where: {
                id: groupId,
            },
            data: {
                members: {
                    create: newMembers.map((id) => ({
                        user: { connect: { id: id } },
                    })),
                },
            },
        });
        res.status(200).json({
            message: "Group updated successfully",
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
}));
app.delete("/delete-group/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.groupMember.deleteMany({
                where: {
                    groupId: id,
                },
            });
            yield tx.group.delete({
                where: {
                    id: id,
                },
            });
        }));
        res.status(200).json({ success: true, message: "Group deleted successfully" });
    }
    catch (error) {
        res.send(500);
        console.log(error);
    }
}));
exports.default = app;
