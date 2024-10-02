import mongoose from "mongoose";
import chalk from "chalk";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.bgGrey("MongoDb connected successfully 👍"));
  } catch (error) {
    console.error(error);
  }
};

export default connectDB;
