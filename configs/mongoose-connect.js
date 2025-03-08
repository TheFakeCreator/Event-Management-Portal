import mongoose from "mongoose";
import dotenv from "dotenv";
import debug from "debug";
dotenv.config();

const log = debug("app:db");

const mongoURI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event-management-portal";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB successfully!");
    log("Connected to MongoDB successfully!");
  } catch (error) {
    console.log("Error connecting to MongoDB:", error.message);
    log("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

connectToDatabase();
export default mongoose.connection;
