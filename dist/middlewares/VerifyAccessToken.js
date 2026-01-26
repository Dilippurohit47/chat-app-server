"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helper_1 = require("../utils/helper");
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
exports.verifyAccessToken = verifyAccessToken;
