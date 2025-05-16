const express = require("express")
const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  itemPhotoUpload,
  getItemPhoto,
  getAvailableItems,
  getItemStats,
} = require("../controllers/item.controller")

const Item = require("../models/Item")

const router = express.Router()

const { protect, authorize } = require("../middlewares/auth")
const advancedResults = require("../middlewares/advancedResults")

// Apply protection middleware to all routes
router.use(protect)

// Photo upload and retrieval routes
router.route("/:id/photo").put(authorize("admin", "manager"), itemPhotoUpload)
router.route("/:id/photo").get(getItemPhoto)

// Get available items - accessible by all users
router.route("/available").get(advancedResults(Item), getAvailableItems)

// Get item statistics
router.route("/stats").get(getItemStats)

// Standard CRUD routes
router.route("/").get(advancedResults(Item), getItems).post(authorize("admin", "manager"), createItem)

router.route("/:id").get(getItem).put(authorize("admin", "manager"), updateItem).delete(authorize("admin"), deleteItem)

module.exports = router
