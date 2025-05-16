const express = require("express")
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersByDepartment,
  getUserStats,
} = require("../controllers/user.controller")

const User = require("../models/User")

const router = express.Router()

const { protect, authorize } = require("../middlewares/auth")
const advancedResults = require("../middlewares/advancedResults")

router.use(protect)

// Special routes
router.get("/department/:dept", authorize("admin", "manager"), getUsersByDepartment)
router.get("/stats", authorize("admin", "manager"), getUserStats)

// Standard CRUD routes
router
  .route("/")
  .get(authorize("admin", "manager"), advancedResults(User), getUsers)
  .post(authorize("admin"), createUser)

router
  .route("/:id")
  .get(authorize("admin", "manager"), getUser)
  .put(authorize("admin", "manager"), updateUser)
  .delete(authorize("admin"), deleteUser)

module.exports = router
