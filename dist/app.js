"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const userAuth_1 = __importDefault(require("./routes/userAuth"));
const messages_1 = __importDefault(require("./routes/messages"));
const chat_1 = __importDefault(require("./routes/chat"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const presignedUrl_1 = __importDefault(require("../src/infra/aws/presignedUrl"));
const group_1 = __importDefault(require("./routes/group"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = require("./middlewares/cors");
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
exports.app.set("trust proxy", 1);
exports.app.use(cors_1.corsMiddleware);
exports.app.use((0, cookie_parser_1.default)());
// only testing purpose
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 1000,
    message: "Too many requests, slow down!",
});
exports.app.use("/user", apiLimiter, userAuth_1.default);
exports.app.use("/chat", apiLimiter, messages_1.default);
exports.app.use("/aws", apiLimiter, presignedUrl_1.default);
exports.app.use("/group", apiLimiter, group_1.default);
exports.app.use("/chat-setting", apiLimiter, chat_1.default);
exports.app.get("/health", (req, res) => {
    res.send("server is live by ci/cd pipelines v1");
});
