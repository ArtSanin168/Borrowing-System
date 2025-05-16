const express = require("express")
const router = express.Router()
const Notification = require("../models/Notification") // adjust path if needed

// Import controller functions
const {
  getUserNotifications,
  // ...other controllers
} = require("../controllers/notification.controller")

const { protect } = require("../middlewares/auth")

// Protect all notification routes
router.use(protect)

// Allow any authenticated user to get their own notifications
router.get("/", getUserNotifications)

// Mark notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    )
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }
    res.json(notification)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Delete a notification
router.delete("/:id", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id)
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }
    res.json({ message: "Notification deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ...other routes (admin-only, etc.)

module.exports = router
