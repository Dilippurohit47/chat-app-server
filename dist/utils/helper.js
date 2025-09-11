"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatZodError = exports.sendToken = exports.JWT_PASSWORD = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.JWT_PASSWORD = process.env.JWT_SECRET || "123456";
const sendToken = (res, user) => {
    if (!res || !user) {
        console.error("response or user needed");
        return;
    }
    if (!exports.JWT_PASSWORD) {
        throw new Error("Jwt secret is required");
    }
    const cookieName = "chat-token";
    try {
        const token = jsonwebtoken_1.default.sign({ id: user.id }, exports.JWT_PASSWORD, {
            expiresIn: "30d",
        });
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        return token;
    }
    catch (err) {
        console.error("Error generating or sending token:", err);
    }
};
exports.sendToken = sendToken;
const formatZodError = (issues) => {
    const error = issues.map((firstError) => {
        return firstError.message;
    });
    return error;
};
exports.formatZodError = formatZodError;
