"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAVE_MESSAGE_JOB_OPTIONS = void 0;
exports.SAVE_MESSAGE_JOB_OPTIONS = {
    attempts: 5,
    backoff: {
        type: "exponential",
        delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
};
