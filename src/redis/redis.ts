import  {createClient ,RedisClientType} from "redis"

const redis:RedisClientType= createClient({
    url:"redis://localhost:6379"
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