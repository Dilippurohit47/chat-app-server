import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv"
import { mockRedisStore } from "./redis/mockStoreRedis";
dotenv.config()

let  subscriber: RedisClientType | any;
if(process.env.NODE_ENV === "production"){
  subscriber = createClient({
  url: process.env.REDIS_URL
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
    return 
  }
return
}

export default subscriber;
