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
Object.defineProperty(exports, "__esModule", { value: true });
exports.callHandler = void 0;
const connectionManager_1 = require("../connectionManager");
const sendToUser = (userId, payload) => {
    const ws = (0, connectionManager_1.getUserSocket)(userId);
    if (!ws)
        return;
    ws.send(JSON.stringify(payload));
};
const callHandler = (data) => __awaiter(void 0, void 0, void 0, function* () {
    switch (data.type) {
        case "offer":
            return handleOffer(data);
        case "answer":
            return handleAnswer(data);
        case "ice-candidate":
            return handleIceCandidate(data);
        case "audio-vedio-toggle":
            return handleAudioVideoToggle(data);
        case "someone-is-calling":
            return handleIncomingCall(data);
        case "call-status":
            return handleCallStatus(data);
        default:
            console.warn("Unknown call event:", data.type);
    }
});
exports.callHandler = callHandler;
const handleOffer = (data) => {
    sendToUser(data.receiverId, {
        type: "offer",
        offer: data.offer,
    });
};
const handleAnswer = (data) => {
    sendToUser(data.receiverId, {
        type: "answer",
        answer: data.answer,
    });
};
const handleIceCandidate = (data) => {
    sendToUser(data.receiverId, {
        type: "ice-candidate",
        candidate: data.candidate,
    });
};
const handleAudioVideoToggle = (data) => {
    sendToUser(data.receiverId, {
        type: "audio-video-toggle",
        audio: data.audio,
        video: data.video,
    });
};
const handleIncomingCall = (data) => {
    sendToUser(data.callReceiverId, {
        type: "someone-is-calling",
        callerData: data.callerData,
    });
};
const handleCallStatus = (data) => {
    if (data.callStatus === "hang-up") {
        sendToUser(data.callReceiverId, {
            type: "client-call-status",
            callStatus: "hang-up",
        });
    }
    if (data.callStatus === "accepted") {
        sendToUser(data.receiverId, {
            type: "client-call-status",
            callStatus: "accepted",
        });
    }
};
