import Redis from "ioredis";

const queueRedis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null
});

export default queueRedis; 