import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv"
dotenv.config()

const subscriber: RedisClientType = createClient({
  url: process.env.REDIS_URL
});

subscriber.on("connect", () => {
  console.log("Subscriber connected");
});

subscriber.on("error", (err) => {
  console.error("Redis Subscriber Error:", err);
}); 
 


export async function connectSubscriber() {
  if (!subscriber.isOpen) {
    await subscriber.connect();
    return 
  }
return
}

export default subscriber;
