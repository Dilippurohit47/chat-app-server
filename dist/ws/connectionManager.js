"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectedEntries = exports.removeUserFromConnections = exports.getAllConnectedUserIds = exports.setUser = exports.getUserSocket = exports.isUserConnected = exports.usersMap = void 0;
exports.usersMap = new Map();
const isUserConnected = (id) => {
    return exports.usersMap.has(id);
};
exports.isUserConnected = isUserConnected;
const getUserSocket = (id) => {
    const user = exports.usersMap.get(id);
    return user ? user.ws : null;
};
exports.getUserSocket = getUserSocket;
const setUser = (id, ws, user) => {
    exports.usersMap.set(id, { ws, userInfo: user });
};
exports.setUser = setUser;
const getAllConnectedUserIds = () => {
    return Array.from(exports.usersMap.keys());
};
exports.getAllConnectedUserIds = getAllConnectedUserIds;
const removeUserFromConnections = (id) => {
    exports.usersMap.delete(id);
};
exports.removeUserFromConnections = removeUserFromConnections;
const getConnectedEntries = () => {
    return Array.from(exports.usersMap.entries()) || [];
};
exports.getConnectedEntries = getConnectedEntries;
