import { UserType } from "../types";
import { WebSocket } from "ws";

type ConnectedUser = {
  ws: WebSocket;
  userInfo: UserType;
  activeChat:string  | null
};

export const usersMap = new Map<string, ConnectedUser>();

export const isUserConnected = (id: string) => {
  return usersMap.has(id);
};

export const getUserSocket = (id: string): WebSocket | null => {
  const user = usersMap.get(id);
  return user ? user.ws : null;
};

export const setUser = (id: string, ws: WebSocket, user: UserType) => {
  usersMap.set(id, { ws, userInfo: user  , activeChat:null});
};

export const getAllConnectedUserIds = () => {
  return Array.from(usersMap.keys());
};

export const removeUserFromConnections = (id: string) => {
  usersMap.delete(id);
};

export const getConnectedEntries = () => {
  return Array.from(usersMap.entries()) || [];
};

export const addActiveChat = ( userId:string ,chatId:string)=>{
  let currentState = usersMap.get(userId)
    if (!currentState) return
  usersMap.set(userId ,{...currentState , activeChat:chatId} )
  console.log(usersMap.get(userId)?.activeChat)
}

export const clearActiveChat = (userId:string) =>{
  let currentState = usersMap.get(userId)
    if (!currentState) return
  usersMap.set(userId ,{...currentState , activeChat:null} )
}

export const getActiveChatId =  (userId:string)=>{
  return usersMap.get(userId)?.activeChat || null
}