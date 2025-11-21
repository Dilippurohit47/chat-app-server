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
exports.getChatBotResponse = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || "",
});
console.log("keys", process.env.OPENAI_API_KEY);
const getChatBotResponse = (query, userData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const SYSTEM_PROMPT = `
You are a helpful and friendly personal chatbot representing Dilip Purohit.
Your goal is to answer questions about Dilip’s professional background, skills, education, experience, and other personal/professional information.

- If the user asks a question that matches information in the vector database, retrieve the answer from the database.
- Always respond in a natural, conversational tone as if you are Dilip himself.
- Do not invent information not present in the database; if the database does not contain the answer, politely say you don't know or ask the user to clarify.
- Keep answers concise and friendly.
- Avoid unrelated topics.

Here is Dilip’s data (vector DB matches):
${userData}
`;
        const completion = yield openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: query }
            ],
        });
        const answer = completion.choices[0].message.content;
        console.log(answer);
        return answer;
    }
    catch (err) {
        console.error("Error generating response:", err);
    }
});
exports.getChatBotResponse = getChatBotResponse;
