import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/users.js";
import dotenv from "dotenv";
import redisClient from "./lib/redis.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const db = mongoose.connection;
db.on("error", (error) => console.error("MongoDB Error:", error));
db.once("open", () => console.log("✅ Connected to MongoDB database"));

const mongoUri =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_PROD_URI
    : process.env.MONGO_URI;

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

app.use(express.json());

app.get("/health", async (req, res) => {
  const health = {
    status: "UP",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: "DOWN",
      redis: "DOWN",
    },
  };

  if (mongoose.connection.readyState === 1) {
    health.services.mongodb = "UP";
  }

  try {
    await redisClient.ping();
    health.services.redis = "UP";
  } catch (err) {
    console.error("Redis health check failed:", err);
  }

  const statusCode =
    health.services.mongodb === "UP" && health.services.redis === "UP"
      ? 200
      : 503;

  res.status(statusCode).json(health);
});

app.get("/metrics", (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    timestamp: new Date().toISOString(),
  };
  res.json(metrics);
});

app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.json({
    message: "REST API with Redis Cache",
    version: "1.0.0",
    endpoints: {
      users: "/users",
      health: "/health",
      metrics: "/metrics",
    },
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const gracefulShutdown = async () => {
  console.log("🔄 Starting graceful shutdown...");

  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");

    await redisClient.quit();
    console.log("✅ Redis connection closed");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`📈 Metrics available at http://localhost:${PORT}/metrics`);
});
