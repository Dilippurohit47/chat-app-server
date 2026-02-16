import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv"
import { mockRedisStore } from "../mockStoreRedis";
import { createRedisMessageHandler } from "./messageDispatcher";
import { prisma } from "../../infra/database/prisma";
import { getUserSocket, isUserConnected } from "../../ws/connectionManager";
import { saveMessage  ,messageAcknowledge ,sendRecentChats} from "../../routes/messages";
import redis from "../redis";
dotenv.config()

let  subscriber: RedisClientType | any;
if(process.env.NODE_ENV === "production"){
  subscriber = createClient({
  url: process.env.REDIS_URL, 
     socket: { 
      reconnectStrategy: () => 1000,
    },
})
}else{
  subscriber = mockRedisStore
}

subscriber.on("connect", () => {
  console.log("Subscriber connected");
});

subscriber.on("error", (err) => {
  console.error("Redis Subscriber Error:", err);
}); 
 


export async function connectSubscriber() {
  if (!subscriber.isOpen) {
    await subscriber.connect();
  }
}

const handleRedisMessage = createRedisMessageHandler({
  saveMessage,
  prisma,
  getUserSocket,
  isUserConnected,
  redis,
  messageAcknowledge,
  sendRecentChats
});



export async function startRedisSubscriber() {
  await subscriber.subscribe("messages", async (msg) => {
    await handleRedisMessage(msg);
  });
}



export default subscriber;
