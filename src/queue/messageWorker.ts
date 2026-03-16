import { Worker } from "bullmq";
import queueRedis from "./queueRedis";
import { saveMessage, sendRecentChats  } from "../routes/messages";
import { getUserSocket, isUserConnected } from "../ws/connectionManager";
import redis from "../redis/redis";

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


  },
  { connection: queueRedis }
); 