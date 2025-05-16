const mongoose = require("mongoose")
const dotenv = require("dotenv")

// Load env vars
dotenv.config()

const connectDB = async () => {
  try {
    // Log the MongoDB URI (with password masked for security)
    const maskedUri = process.env.MONGO_URI
      ? process.env.MONGO_URI.replace(/:([^@]+)@/, ":****@")
      : "MongoDB URI not found"
    console.log(`Attempting to connect to MongoDB: ${maskedUri}`)

    // Set mongoose options
    mongoose.set("strictQuery", false)

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold)
    return conn
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`.red.bold)
    throw error // Re-throw to be caught by the caller
  }
}

module.exports = connectDB
