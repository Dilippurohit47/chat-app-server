import { addActiveChat, clearActiveChat } from "../connectionManager";

export const activeChatHandler = async(data ,connectedUserId) =>{
    switch (data.type){ 
        case "active-chat:set":
           return addActiveChat(connectedUserId,data.chatId)
        case "active-chat:clear":
            return clearActiveChat(connectedUserId)

        default:
            console.warn("Unknown handler type",data.type)
    }    
}
