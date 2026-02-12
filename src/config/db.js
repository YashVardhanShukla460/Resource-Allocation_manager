const mongoose = require("mongoose");
const { mongoUri } = require("./env");

async function connectDb() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required in environment variables.");
  }

  await mongoose.connect(mongoUri);
}

module.exports = { connectDb };
