"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authorizeToken = (req, res, next) => {
    try {
        const token = req.cookies["chat-token"];
        if (!token) {
            res.status(404).json({
                message: "Login First"
            });
        }
        const user = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (typeof user === "string") {
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.log(error);
        res.status(403).json({
            message: "Invalid Token"
        });
        return;
    }
};
exports.authorizeToken = authorizeToken;
