import {createClient ,RedisClientType } from "redis"

  const publsiher:RedisClientType  =  createClient({
    url:"redis://localhost:6379"
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