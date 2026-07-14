import publisher from "../redis/publisher/publisherRedis";

export const broadcastRecentChats = async (userId: string, chats: any) => {
  await publisher.publish(
    "messages",
    JSON.stringify({ type: "recent-chats", userId, chats })
  );
}; 