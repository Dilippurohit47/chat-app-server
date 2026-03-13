import { Worker } from "bullmq";
import queueRedis from "./queueRedis";
import { saveMessage  } from "../routes/messages";

new Worker("message-persistence", async (job) => {
    const data = job.data;
    await saveMessage(
      data.tempId,
      data.senderId,
      data.receiverId,
      data.isMedia,
      data.receiverContent,
      data.senderContent
    );
  },
  { connection: queueRedis }
); 