const cloudinary = require("cloudinary").v2
const dotenv = require("dotenv")

// Load env vars
dotenv.config()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Test the connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error("Cloudinary connection error:", error)
  } else {
    console.log("Cloudinary connected:", result)
  }
})

module.exports = cloudinary
