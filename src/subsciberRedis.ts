import { createClient, RedisClientType } from "redis";

const subscriber: RedisClientType = createClient({
  url: "redis://localhost:6379",
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
