"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const allowedOrigins = (_b = (_a = process.env.CORS_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(",")) !== null && _b !== void 0 ? _b : [];
console.log("origins---------", allowedOrigins);
exports.corsMiddleware = (0, cors_1.default)({
    origin(origin, callback) {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
