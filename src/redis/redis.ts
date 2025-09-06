import  {createClient ,RedisClientType} from "redis"
import dotenv from "dotenv"
dotenv.config()
const redis:RedisClientType= createClient({
    url:process.env.REDIS_URL
})
redis.on("error",(error) =>{
    // console.log("Error in main redis" ,error)
})
 
redis.on("ready", () => {
  console.log("main Redis is ready to use");
});

(async() =>{
    await redis.connect()
})()

export default redis   