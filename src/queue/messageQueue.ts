import { Queue } from "bullmq";
import queueRedis from "./queueRedis"
export const messageQueue = new Queue("message-persistence", {
  connection:queueRedis
});