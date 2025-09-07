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
const redis_1 = __importDefault(require("../redis/redis"));
const app = express_1.default.Router();
app.post("/create-group", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, members } = req.body;
        if (!name || members.length <= 0) {
            res.status(403).json({
                message: "Missing fields required",
            });
            return;
        }
        yield prisma_1.prisma.group.create({
            data: {
                name: name,
                members: {
                    create: members.map((userId) => ({
                        user: { connect: { id: userId } },
                    })),
                },
            },
        });
        members.forEach((userId) => __awaiter(void 0, void 0, void 0, function* () {
            yield redis_1.default.del(`groupId:${userId}`);
        }));
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
        const cachedgroups = yield redis_1.default.get(`groupId:${userId}`);
        if (cachedgroups) {
            res.status(200).json({
                groups: JSON.parse(cachedgroups),
                message: "from redis cache"
            });
            return;
        }
        const groups = yield prisma_1.prisma.group.findMany({
            where: {
                members: {
                    some: {
                        userId: userId,
                    },
                },
                deletedby: {
                    none: {
                        userId: userId
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        yield redis_1.default.set(`groupId:${userId}`, JSON.stringify(groups), {
            EX: 3600
        });
        res.status(200).json({
            groups: groups,
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
        return;
    }
}));
app.post("/add-new-members", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { newMembers } = req.body;
        const groupId = req.query.groupId;
        if (!groupId) {
            res.status(403).json({
                message: "Group id is absent!",
            });
            return;
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
            include: {
                members: true
            }
        });
        (_a = data === null || data === void 0 ? void 0 : data.members) === null || _a === void 0 ? void 0 : _a.forEach((member) => __awaiter(void 0, void 0, void 0, function* () {
            yield redis_1.default.del(`groupId:${member.userId}`);
        }));
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
app.delete("/delete-group/:groupId/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { groupId, userId } = req.params;
        if (!groupId || !userId) {
            console.log("user id and group id required for deleting group");
            res.status(403).json({
                message: "Insufficent credentials"
            });
            return;
        }
        yield prisma_1.prisma.deletedGroup.create({
            data: {
                userId: userId,
                groupId: groupId
            }
        });
        yield redis_1.default.del(`groupId:${userId}`);
        res.status(200).json({ success: true, message: "Group deleted successfully" });
        return;
    }
    catch (error) {
        res.send(500);
        console.log(error);
    }
}));
exports.default = app;
