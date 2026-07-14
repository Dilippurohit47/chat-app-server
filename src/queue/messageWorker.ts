import { Worker } from "bullmq";
import queueRedis from "./queueRedis";
import { saveMessage, sendRecentChats  } from "../routes/messages";
import { getUserSocket, isUserConnected } from "../ws/connectionManager";
import redis from "../redis/redis";
import { broadcastRecentChats } from "../ws/broadcast";

new Worker("message-persistence", async (job) => {
    const data = job.data;
    await saveMessage(
      data.tempId,
      data.senderId,
      data.receiverId,
      data.isMedia,
      data.receiverContent,
      data.senderContent,
      data.isChatActive,
    );

const senderChats = await sendRecentChats(data.senderId);
const receiverChats = await sendRecentChats(data.receiverId);

await redis.set(`user:${data.senderId}:chats`, JSON.stringify(senderChats), { EX: 600 });
await redis.set(`user:${data.receiverId}:chats`, JSON.stringify(receiverChats), { EX: 600 });

await broadcastRecentChats(data.senderId, senderChats);
await broadcastRecentChats(data.receiverId, receiverChats);
  },
  { connection: queueRedis }
); 