import {createClient ,RedisClientType } from "redis"
import dotenv from "dotenv"
import { mockRedisStore } from "./redis/mockStoreRedis";
dotenv.config()

  let publisher:RedisClientType | any;
  if(process.env.NODE_ENV === "production"){
    publisher   =  createClient({
    url:process.env.REDIS_URL
})
  }else{
    publisher = mockRedisStore
  }

publisher.on("error" , (error)=> {console.log(error)})
publisher.on("connect", () => {
  console.log("Redis is connected to local");
});

publisher.on("ready", () => {
  console.log("Redis is ready to use");
});


(async() =>{
await publisher.connect()
})()
export default publisher