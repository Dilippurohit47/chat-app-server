
import { WebSocket } from "ws";
import { logWarn } from "../../helper";
// import { getInfoFromCollection } from "../../infra/vector/vector-db";
import { getChatBotResponse } from "../../routes/aiChatBot";
import { getUserSocket } from "../connectionManager";

export const chatbotHandler = (data,ws:WebSocket) =>{
    switch (data.type) {
        case "get-chatbot-response":
            return getChatBotResponseAndSend(data,ws)       
        default:
            logWarn(`Unknown handler in chat bot ${data.type}`)
    }
}

const getChatBotResponseAndSend = async(data,wss:WebSocket)=>{
        const query = data.query;
        const ws = getUserSocket(data?.receiverId);
        // const personalData = (await getInfoFromCollection(query)) as string[];
        const answer = await getChatBotResponse(query || "hello", ["Dilip raj Purohit best software engineer"]);
        if (ws) {
          ws.send(
            JSON.stringify({
              type: "chatbot-reply",
              answer: answer,
              receiverId: data.receiverId,
            }),
          );
        }
}