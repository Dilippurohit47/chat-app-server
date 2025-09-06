import {createClient ,RedisClientType } from "redis"
import dotenv from "dotenv"
dotenv.config()

  const publsiher:RedisClientType  =  createClient({
    url:process.env.REDIS_URL
})

publsiher.on("error" , (error)=> {console.log(error)})
publsiher.on("connect", () => {
  console.log("Redis is connected to local");
});

publsiher.on("ready", () => {
  console.log("Redis is ready to use");
});


(async() =>{
await publsiher.connect()
})()
export default publsiher