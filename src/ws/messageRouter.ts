import { WebSocketServer, WebSocket } from "ws";
import { userHandler } from "./handlers/user.handler";
import { chatHandler } from "./handlers/chat.handler";
import { callHandler } from "./handlers/call.handler";
import { prisma } from "../infra/database/prisma";
import { chatbotHandler } from "./handlers/chatbot.handler";
import publisher from "../redis/publisher/publisherRedis";
import { activeChatHandler } from "./handlers/activeChatHandler";

let pubSubCases = ["personal-msg" , "group-message","typing" , "typing-stop" , "send-groups","message-acknowledge"]

export const messageRouter = async (
  message:any,
  ws: WebSocket,
  wss: WebSocketServer,
  connectedUserId:string
) => {

  const rawData = message.toString() 
  const data = JSON.parse(rawData)
  
   if (pubSubCases.includes(data.type)) {
    await publisher.publish("messages", rawData);
    return; 
  }

  switch (data.type) {
    case "user-info": 
      return userHandler(data, ws, wss, prisma);

    case "active-chat:set":
    case  "active-chat:clear":
        return activeChatHandler(data,connectedUserId ) 

    case "get-recent-chats":
      return chatHandler(data, ws, wss);
    case "offer":
    case "answer":
    case "ice-candidate":
    case "audio-vedio-toggle":
    case "someone-is-calling":
    case "call-status":
      return callHandler(data);

    case "get-chatbot-response":
      return chatbotHandler(data, ws);

    default:
    // console.warn("Unknown Ws Handler",data.type)
  }
};
