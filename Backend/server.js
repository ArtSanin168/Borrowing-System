const express = require("express")
const dotenv = require("dotenv")
const morgan = require("morgan")
const colors = require("colors")
const cookieParser = require("cookie-parser")
const fileupload = require("express-fileupload")
const cors = require("cors")
const path = require("path")
const fs = require("fs")

// Load env vars first
dotenv.config()

// Initialize express app
const app = express()

// Body parser with increased limit
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Cookie parser
app.use(cookieParser())

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// File uploading
app.use(
  fileupload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  }),
)

// Enable CORS - more permissive for development
app.use(
  cors({
    origin: (origin, callback) => {
      return callback(null, true)
    },
    credentials: true,
  }),
)

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "public", "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log(`Created uploads directory: ${uploadsDir}`.green)
}

// Set static folder with proper path
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")))
app.use(express.static(path.join(__dirname, "public")))

// Simple route to test if server is running
app.get("/", (req, res) => {
  res.json({ message: "API is running" })
})

// Test endpoint for uploads
app.get("/api/test-upload", (req, res) => {
  res.json({
    message: "Upload endpoint is working",
    uploadsPath: uploadsDir,
    exists: fs.existsSync(uploadsDir),
  })
})

// Connect to database with error handling
const connectDB = require("./config/db")
connectDB()
  .then(() => {
    console.log("MongoDB connected successfully".cyan.underline.bold)

    // Only mount routes after successful DB connection
    try {
      console.log("Loading route modules...")

      // Load each route module individually with error handling
      let authRoutes, userRoutes, itemRoutes, borrowRoutes, notificationRoutes

      try {
        authRoutes = require("./routes/auth.routes")
        console.log("✓ Auth routes loaded")
      } catch (err) {
        console.error("✗ Failed to load auth routes:", err.message)
      }

      try {
        userRoutes = require("./routes/user.routes")
        console.log("✓ User routes loaded")
      } catch (err) {
        console.error("✗ Failed to load user routes:", err.message)
      }

      try {
        itemRoutes = require("./routes/item.routes")
        console.log("✓ Item routes loaded")
      } catch (err) {
        console.error("✗ Failed to load item routes:", err.message)
      }

      try {
        borrowRoutes = require("./routes/borrow.routes")
        console.log("✓ Borrow routes loaded")
      } catch (err) {
        console.error("✗ Failed to load borrow routes:", err.message)
        console.error("Error details:", err.stack)
      }

      try {
        notificationRoutes = require("./routes/notification.routes")
        console.log("✓ Notification routes loaded")
      } catch (err) {
        console.error("✗ Failed to load notification routes:", err.message)
      }

      // Mount routers - only if they were successfully loaded
      console.log("Mounting routes...")
      if (authRoutes) app.use("/api/auth", authRoutes)
      if (userRoutes) app.use("/api/users", userRoutes)
      if (itemRoutes) app.use("/api/items", itemRoutes)
      if (borrowRoutes) app.use("/api/borrow", borrowRoutes)
      if (notificationRoutes) app.use("/api/notifications", notificationRoutes)

      console.log("Routes mounted successfully")

      // Add a route to serve images directly from the database
      app.get("/api/items/:id/photo", async (req, res) => {
        try {
          const Item = require("./models/Item")
          const item = await Item.findById(req.params.id)

          if (!item || !item.image || !item.image.data) {
            return res.status(404).send("Image not found")
          }

          res.set("Content-Type", item.image.contentType || "image/jpeg")
          return res.send(item.image.data)
        } catch (err) {
          console.error("Error serving image:", err)
          return res.status(500).send("Server error")
        }
      })

      // Error handler middleware
      const errorHandler = require("./middlewares/errorHandler")
      app.use(errorHandler)

      // 404 handler - must be after all routes
      app.use((req, res) => {
        res.status(404).json({
          success: false,
          error: `Route not found: ${req.originalUrl}`,
        })
      })

      console.log("Server setup complete")
    } catch (error) {
      console.error("Error setting up routes:".red.bold, error)
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error("Database connection failed:".red.bold, err)
    process.exit(1)
  })

const PORT = process.env.PORT || 5000

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold),
)

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red)
  server.close(() => process.exit(1))
})

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`Uncaught Exception: ${err.message}`.red.bold)
  console.error(err.stack)
  server.close(() => process.exit(1))
})
