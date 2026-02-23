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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const app = express_1.default.Router();
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});
app.post("/get-presigned-url-s3", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: "chat-app-bucket47",
            Key: `profile-pictures/${Date.now()}-${"profile-image"}`,
            ContentType: "jpeg",
        });
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 60 });
        res.status(200).json({
            url
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
}));
app.post("/get-presigned-url-s3-media", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: "chat-app-bucket47",
            Key: `media-images/${Date.now()}-${"media"}`,
            ContentType: "jpeg",
        });
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 60 });
        res.status(200).json({
            url
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
}));
exports.default = app;
