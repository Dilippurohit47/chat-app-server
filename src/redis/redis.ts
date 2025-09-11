import  {createClient ,RedisClientType} from "redis"
import dotenv from "dotenv"
dotenv.config()
let redis: RedisClientType | any;

if (process.env.NODE_ENV === "production") {
  redis = createClient({
    url: process.env.REDIS_URL,
  });
} else {
  const mockStore = new Map<string, string>();
  redis = {
    get: async (k: string) => mockStore.get(k),
    set: async (k: string, v: string) => {
      mockStore.set(k, v);
      return "OK";
    },
    publish: async (ch: string, msg: string) =>
      console.log(`[MockPub] ${ch}: ${msg}`),
    subscribe: async (ch: string, cb: (msg: string) => void) =>
      console.log(`[MockSub] ${ch}`),
    on: () => {}, 
    connect: async () => {}, 
    quit: async () => {}, 
  };
}

redis.on("error",(error) =>{
    console.log("Error in main redis" ,error) 
})
 
redis.on("ready", () => {
  console.log("main Redis is ready to use");
});

(async() =>{
    await redis.connect()
})()

export default redis   