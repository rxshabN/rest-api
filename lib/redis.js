// for production and development both, depends on node env value in compose.yml
import redis from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisURL =
  process.env.NODE_ENV === "production"
    ? process.env.REDIS_PROD_URL
    : process.env.REDIS_DEV_URL;

const redisClient = redis.createClient({
  url: redisURL,
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis");
});

(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
})();

export default redisClient;
