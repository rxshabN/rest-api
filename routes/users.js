import express, { json } from "express";
import User from "../models/User.js";
import redisClient from "../lib/db.js";

const router = express.Router();
export default router;

// Key constants for Redis
const USER_CACHE_KEY = (id) => `users:${id}`;

// with redis

router.get("/", async (req, res) => {
  try {
    // Get all keys from Redis
    const keys = await redisClient.keys("*"); // not to use in production as it can block redis server
    const users = [];

    // Loop through keys and get their values
    for (const key of keys) {
      const user = await redisClient.get(key);
      if (user) users.push(user);
    }

    // Fallback to MongoDB if Redis is empty
    if (users.length === 0) {
      const dbUsers = await User.find().lean();

      // Cache users in Redis
      for (const user of dbUsers) {
        await redisClient.set(`user:${user._id}`, JSON.stringify(user), {
          EX: 31536000, // 1 year expiry
        });
      }

      console.log("🚀 Served from MongoDB");
      return res.json(JSON.parse(dbUsers));
    }

    console.log("🚀 Served from Redis Cache");
    const parsedUsers = users.map((user) => JSON.parse(user));
    res.json(parsedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// without redis

// router.get("/", async (req, res) => {
//   try {
//     const users = await User.find();
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

router.get("/:id", getUser, (req, res) => {
  res.json(JSON.parse(res.user)); // Directly use the user set by middleware
});

// Creating one user and saving it to the database using POST method
router.post("/", async (req, res) => {
  const user = new User({
    name: req.body.name,
    age: req.body.age,
    birthdate: req.body.birthdate,
  });
  try {
    const newUser = await user.save();
    await redisClient.set(USER_CACHE_KEY(newUser.id), JSON.stringify(newUser), {
      EX: 31536000, // Cache expiry: 31536000 seconds (adjust as needed)
    });
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Updating one user and saving it in the database using PATCH method
router.patch("/:id", getUser, async (req, res) => {
  const userId = req.params.id;
  try {
    if (!res.user) return res.status(404).json({ message: "User not found" });

    const updates = {};
    if (req.body.name != null) updates.name = req.body.name;
    if (req.body.age != null) updates.age = req.body.age;
    if (req.body.birthdate != null) updates.birthdate = req.body.birthdate;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Directly update in MongoDB
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true, // returns updated document
      runValidators: true, // ensure schema validation
    });
    // Invalidate or update cache
    await redisClient.set(USER_CACHE_KEY(userId), JSON.stringify(updatedUser), {
      EX: 31536000,
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Deleting one user from the database by using ID as a parameter with the DELETE method
router.delete("/:id", getUser, async (req, res) => {
  const userId = req.params.id;
  try {
    if (!res.user) return res.status(404).json({ message: "User not found" });
    const userDoc = new User(res.user);
    await userDoc.deleteOne();
    await redisClient.del(USER_CACHE_KEY(userId));
    res.json({ message: "Successfully deleted user" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Middleware function for getting user object by ID and reuse it in other functions, returning error if user ID is not found
async function getUser(req, res, next) {
  try {
    const cachedUser = await redisClient.get(USER_CACHE_KEY(req.params.id));
    if (cachedUser) {
      console.log("🚀 Used Redis Cache");
      res.user = cachedUser;
      return next();
    }
    const user = await User.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({ message: "Cannot find user" });
    }
    res.user = user.toObject();
    await redisClient.set(USER_CACHE_KEY(req.params.id), JSON.stringify(user), {
      EX: 31536000,
    });
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
