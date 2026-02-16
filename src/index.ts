
import { connectSubscriber, startRedisSubscriber } from "./redis/subscriber/subsciberRedis";
import { registerWebSocketHandlers } from "./ws/wsServer";
import { startWsHeartbeat } from "./ws/startWsHearBeat";
import { server, wss } from "./server";
import "./infra/vector/vector-db"

process.on("unhandledRejection", (reason, promise) => {
  console.error("🔥 Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

const PORT = process.env.PORT  || 8080;

const bootstrap = async()=>{
try {
  await connectSubscriber();
  await startRedisSubscriber();
  registerWebSocketHandlers(wss);
  startWsHeartbeat(wss)

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);  
});

} catch (err) {
  console.error("Startup failed", err);
  process.exit(1);
}
}
  
bootstrap()


