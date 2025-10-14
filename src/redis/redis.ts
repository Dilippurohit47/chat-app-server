import  {createClient ,RedisClientType} from "redis"
import dotenv from "dotenv"
import { mockRedisStore } from "./mockStoreRedis";
dotenv.config()
let redis: RedisClientType | any;
if (process.env.NODE_ENV === "production") {
  redis = createClient({
    url: process.env.REDIS_URL,
  }); 
} else {
  redis = mockRedisStore
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