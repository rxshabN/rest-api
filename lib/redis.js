// for production
import redis from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = redis.createClient({
  url: process.env.REDIS_PROD_URL,
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

if (!redisClient.isOpen) {
  await redisClient.connect();
}

export default redisClient;

// for development
// import redis from "redis";
// import dotenv from "dotenv";
// dotenv.config();

// const redisClient = redis.createClient({
//   url: process.env.REDIS_DEV_URL, (OR REDIS_LOCAL_URL if using nodemon/node server.js)
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
