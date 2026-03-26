"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveChatId = exports.clearActiveChat = exports.addActiveChat = exports.getConnectedEntries = exports.removeUserFromConnections = exports.getAllConnectedUserIds = exports.setUser = exports.getUserSocket = exports.isUserConnected = exports.usersMap = void 0;
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
    exports.usersMap.set(id, { ws, userInfo: user, activeChat: null });
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
const addActiveChat = (userId, chatId) => {
    var _a;
    let currentState = exports.usersMap.get(userId);
    if (!currentState)
        return;
    exports.usersMap.set(userId, Object.assign(Object.assign({}, currentState), { activeChat: chatId }));
    console.log((_a = exports.usersMap.get(userId)) === null || _a === void 0 ? void 0 : _a.activeChat);
};
exports.addActiveChat = addActiveChat;
const clearActiveChat = (userId) => {
    let currentState = exports.usersMap.get(userId);
    if (!currentState)
        return;
    exports.usersMap.set(userId, Object.assign(Object.assign({}, currentState), { activeChat: null }));
};
exports.clearActiveChat = clearActiveChat;
const getActiveChatId = (userId) => {
    var _a;
    return ((_a = exports.usersMap.get(userId)) === null || _a === void 0 ? void 0 : _a.activeChat) || null;
};
exports.getActiveChatId = getActiveChatId;
