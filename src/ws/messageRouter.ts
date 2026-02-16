import { WebSocketServer ,WebSocket} from "ws";
import { userHandler } from "./handlers/user.handler";
import { chatHandler } from "./handlers/chat.handler";
import { callHandler } from "./handlers/call.handler";
import { prisma } from "../infra/database/prisma";
import { chatbotHandler } from "./handlers/chatbot.handler";

export const messageRouter = async(data , ws:WebSocket ,wss:WebSocketServer)=>{
    switch(data.type){
        case "user-info":
        return userHandler(data,ws,wss ,prisma)

        case "get-recent-chats":
        return chatHandler(data,ws,wss)

        case "offer":
        case "answer":
        case "ice-candidate":
        case "audio-vedio-toggle":
        case "someone-is-calling":
        case "call-status":
        return callHandler(data);

        case "get-chatbot-response":
        return chatbotHandler(data,ws)
      
        default:
            console.warn("Unknown Ws Handler",data.type)
    }
}