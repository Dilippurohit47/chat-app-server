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
const helper_1 = require("../utils/helper");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("../types/zod");
const app = express_1.default.Router();
app.post("/sign-in", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        console.log(email, password);
        if (!email || !password) {
            res.status(404).json({
                message: "Please Fill all fields",
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            res.status(404).json({
                message: "user not found",
            });
            return;
        }
        if ((user === null || user === void 0 ? void 0 : user.password) !== password) {
            res.status(403).json({
                message: "Password or email is incorrect",
            });
            return;
        }
        const token = (0, helper_1.sendToken)(res, user);
        res.status(200).json({
            message: "Login successfull",
            token: token,
            user,
        });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.post("/sign-up", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, profileUrl } = req.body;
        const parsedData = zod_1.singnUpSchema.safeParse(req.body);
        if (!parsedData.success) {
            const dataError = (0, helper_1.formatZodError)(parsedData.error.issues);
            res.status(403).json({
                message: dataError[0]
            });
            return;
        }
        const userExist = yield prisma_1.prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (userExist) {
            res.status(404).json({
                message: "User with this email already exist"
            });
            return;
        }
        const user = yield prisma_1.prisma.user.create({
            data: {
                name: name,
                email: email,
                password: password,
                profileUrl,
            },
        });
        (0, helper_1.sendToken)(res, user);
        res.status(200).json({
            message: "User created Successfully",
            user
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.get("/get-user", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cookie = req.cookies["chat-token"];
        if (!cookie) {
            return res.status(404).json({
                message: "Please login first",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(cookie, process.env.JWT_SECRET);
        // ✅ Use `await` in an `async` function
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.get("/all-users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                profileUrl: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error",
        });
    }
}));
app.post("/sign-out", (req, res) => {
    try {
        res.clearCookie("chat-token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });
        res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.default = app;
