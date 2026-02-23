import { WebSocket, WebSocketServer } from "ws";
import { logWarn } from "../../helper";
import { sendRecentChats } from "../../routes/messages";

 export const chatHandler = async (data,ws:WebSocket,wss:WebSocketServer)=>{

    switch (data.type) {

        case "get-recent-chats":
            return getRecentChatsHandler(data,ws)

        default:
            logWarn(`unknown handler ${data.type}`)
    }

 }

 const getRecentChatsHandler = async(data,ws:WebSocket)=>{
             const recentChats = await sendRecentChats(data.userId);
         if (!ws) return;
         ws.send(
           JSON.stringify({
             type: "recent-chats",
             chats: recentChats,
           }),
         );
 }

