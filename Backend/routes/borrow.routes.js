const express = require("express")
const router = express.Router()

// Import controller functions
const {
  getBorrowRequests,
  getBorrowRequest,
  createBorrowRequest,
  updateBorrowRequest,
  deleteBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  returnBorrowedItem,
  getUserBorrowRequests,
  getMyActiveBorrowings,
  getMyBorrowingHistory,
  cancelBorrowRequest,
  getBorrowStats,
  getRecentActivity,
} = require("../controllers/borrow.controller")

const BorrowRequest = require("../models/BorrowRequest")

const { protect, authorize } = require("../middlewares/auth")
const advancedResults = require("../middlewares/advancedResults")

router.use(protect)

// Special routes
router.get("/me/active", getMyActiveBorrowings)
router.get("/me/history", getMyBorrowingHistory)
router.put("/:id/approve", authorize("admin", "manager"), approveBorrowRequest)
router.put("/:id/reject", authorize("admin", "manager"), rejectBorrowRequest)
router.put("/:id/return", returnBorrowedItem)
router.put("/:id/cancel", cancelBorrowRequest)
router.get("/stats", authorize("admin", "manager"), getBorrowStats)
router.get("/recent-activity", authorize("admin", "manager"), getRecentActivity)

// Standard CRUD routes
router
  .route("/")
  .get(
    advancedResults(BorrowRequest, [
      { path: "user", select: "name email" },
      { path: "item", select: "name category status" },
    ]),
    getBorrowRequests,
  )
  .post(createBorrowRequest)

router.route("/:id").get(getBorrowRequest).put(updateBorrowRequest).delete(deleteBorrowRequest)

// Get user's borrow requests
router.get("/user/:userId", authorize("admin", "manager"), getUserBorrowRequests)

module.exports = router
