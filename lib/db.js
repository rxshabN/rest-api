// for production
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

if (redisClient) {
  console.log("Redis connected successfully");
} else {
  console.log("Redis connection failed");
}

export default redisClient;

// for development
// import redis from "redis";
// import dotenv from "dotenv";
// dotenv.config();

// const redisClient = redis.createClient({
//   url: process.env.REDIS_DEV_URL,
// });

// redisClient.on("error", (err) => {
//   console.error("Redis Error:", err);
// });

// redisClient.on("connect", () => {
//   console.log("Connected to Redis");
// });

// if (!redisClient.isOpen) {
//   await redisClient.connect();
// }

// export default redisClient;
