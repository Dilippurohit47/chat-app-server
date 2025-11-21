import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});
console.log("keys",process.env.OPENAI_API_KEY)
export const getChatBotResponse = async (query: string, userData: string[]) => {
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

const completion = await openai.chat.completions.create({
  model: "gpt-4.1",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: query }  
  ],
});

    const answer = completion.choices[0].message.content;
    console.log(answer);

    return answer;
  } catch (err) {
    console.error("Error generating response:", err);
  }
};
