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
const redis_1 = __importDefault(require("../redis/redis"));
const app = express_1.default.Router();
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cookie = req.cookies["chat-token"];
        if (!cookie) {
            return res.status(404).json({
                message: "Please login first",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(cookie, process.env.JWT_SECRET);
        if (!decoded) {
            res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
            return;
        }
        if (typeof decoded === "string") {
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            succcess: false,
            message: "Internal server error"
        });
    }
});
app.post("/sign-in", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
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
            select: {
                id: true,
                profileUrl: true,
                name: true,
                password: true,
            }
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
        yield prisma_1.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                refreshToken: token
            },
        });
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
const verifyAccessToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            res.status(401).json({ message: "Access token missing" });
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({ message: "Invalid authorization header" });
            return;
        }
        jsonwebtoken_1.default.verify(token, helper_1.JWT_PASSWORD, (err, decoded) => {
            if (err) {
                console.log(err);
                res.status(403).json({ message: "Invalid or expired token" });
                return;
            }
            if (typeof decoded === "string") {
                return;
            }
            req.user = decoded;
            next();
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
        return;
    }
};
app.get("/get-user", verifyAccessToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(404).json({
                success: false,
                message: "Authorization failed"
            });
            return;
        }
        const userId = req.user.id;
        const cachedUser = yield redis_1.default.get(`user:${userId}`);
        if (cachedUser) {
            res.status(200).json({ user: JSON.parse(cachedUser) });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                profileUrl: true,
                name: true,
                id: true,
            }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        yield redis_1.default.set(`user:${user.id}`, JSON.stringify(user), {
            EX: 3600
        });
        res.status(200).json({ user: user, message: "user fetched" });
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
app.get('/refresh', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies["chat-token"];
    try {
        if (!token) {
            res.status(403).json({
                message: "Unauthorized"
            });
            return;
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                refreshToken: token
            }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Unauthorized , Login first"
            });
            return;
        }
        if (!user.refreshToken) {
            res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
            return;
        }
        try {
            jsonwebtoken_1.default.verify(user.refreshToken, helper_1.JWT_PASSWORD);
        }
        catch (err) {
            res.clearCookie("chat-token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            });
            res.status(403).json({ message: "Refresh token expired, please login again" });
            return;
        }
        if (!user) {
            res.status(403).json({ message: "Invalid refresh token" });
            return;
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id }, helper_1.JWT_PASSWORD, {
            expiresIn: "15m"
        });
        res.status(200).json({
            accessToken
        });
        return;
    }
    catch (error) {
        console.log("error in generating accesstoken", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}));
app.get("/checking", verifyAccessToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json();
    }
    catch (error) {
        console.log(error);
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
