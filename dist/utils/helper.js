"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.JWT_PASSWORD = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.JWT_PASSWORD = "123456";
const sendToken = (res, user) => {
    if (!res || !user) {
        console.error("response or user needed");
        return;
    }
    const cookieName = "chat-token";
    try {
        const token = jsonwebtoken_1.default.sign({ id: user.id }, exports.JWT_PASSWORD, {
            expiresIn: "30d",
        });
        res.cookie(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure only in production
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" in prod, "lax" in dev
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        return token;
    }
    catch (err) {
        console.error("Error generating or sending token:", err);
    }
};
exports.sendToken = sendToken;
