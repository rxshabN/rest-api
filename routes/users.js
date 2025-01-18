const express = require("express");
const router = express.Router();
module.exports = router;
const User = require("../models/User");

// Getting all users
router.get("/", async (req, res) => {
  try {
    const user = await User.find();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Getting one user
router.get("/:id", getUser, (req, res) => {
  res.json(res.user);
});

// Creating one user
router.post("/", async (req, res) => {
  const user = new User({
    name: req.body.name,
    age: req.body.age,
    birthdate: req.body.birthdate,
  });
  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Updating one user
router.patch("/:id", getUser, async (req, res) => {
  if (req.body.name != null) {
    res.user.name = req.body.name;
  }
  if (req.body.age != null) {
    res.user.age = req.body.age;
  }
  if (req.body.birthdate != null) {
    res.user.birthdate = req.body.birthdate;
  }
  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Deleting one user
router.delete("/:id", getUser, async (req, res) => {
  try {
    await res.user.deleteOne();
    res.json({ message: "Successfully deleted user" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Middleware function for getting user object by ID and reuse it in other functions, returning error if user ID is not found
async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({ message: "Cannot find user" });
    }
    res.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
