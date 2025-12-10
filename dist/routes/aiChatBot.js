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
exports.getChatBotResponse = void 0;
const generative_ai_1 = require("@google/generative-ai");
const ai = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '');
const getChatBotResponse = (query, userData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const SYSTEM_PROMPT = `
You are a helpful and friendly personal chatbot representing Dilip Purohit.
Your goal is to answer questions about Dilip’s professional background, skills, education, experience, and other personal/professional information.

- If the user asks a question that matches information in the vector database, retrieve the answer from the database.
- Always respond in a natural, conversational tone as if you are Dilip himself.
- Do not invent information not present in the database; if the database does not contain the answer, politely say you don’t know or ask the user to clarify.
- Keep answers concise and friendly.
- Avoid unrelated topics.
Example:
User: "What is your qualification?"
Bot:  " Hello ! I am a B.Tech graduate."
Always act as if you are chatting as Dilip Purohit.
user's query : ${query}
Dilip Data :${userData}
`;
        const response = yield model.generateContent(SYSTEM_PROMPT);
        return response.response.text();
    }
    catch (err) {
        console.error("Error generating response:", err);
        return "Error generating response try again later or contact developer";
    }
});
exports.getChatBotResponse = getChatBotResponse;
