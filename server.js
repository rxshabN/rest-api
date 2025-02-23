import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/users.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to MongoDB database"));
//for development
// mongoose.connect(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_PROD_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(express.json());
app.use("/users", userRouter);
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
