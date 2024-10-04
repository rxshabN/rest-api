require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.error("Connected to database"));
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(express.json());
const userRouter = require("./routes/users");
app.use("/users", userRouter);
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
