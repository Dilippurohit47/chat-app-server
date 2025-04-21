"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.singnUpSchema = void 0;
const zod_1 = require("zod");
exports.singnUpSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, { message: "Name must be at least 3 characters long" })
        .nonempty({ message: "name is required" }),
    email: zod_1.z.string().min(11, { message: "Email must be at least % Characters long" }),
    password: zod_1.z.string().min(6, { message: "password must be 6 characters long" })
});
