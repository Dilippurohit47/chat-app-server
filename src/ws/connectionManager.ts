import { UserType } from "../types";
import { WebSocket } from "ws";

type ConnectedUser = {
  ws: WebSocket;
  userInfo: UserType;
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
  usersMap.set(id, { ws, userInfo: user });
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
