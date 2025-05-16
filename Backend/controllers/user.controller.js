const User = require("../models/User")
const asyncHandler = require("../middlewares/asyncHandler")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  // Use the advancedResults middleware if it's available
  if (res.advancedResults) {
    return res.status(200).json(res.advancedResults)
  }

  // Otherwise, fetch all users
  const users = await User.find().select("-password")

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  })
})

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body)

  res.status(201).json({
    success: true,
    data: user,
  })
})

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404))
  }

  await user.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Get users by department
// @route   GET /api/users/department/:dept
// @access  Private/Admin/Manager
exports.getUsersByDepartment = asyncHandler(async (req, res, next) => {
  const users = await User.find({ department: req.params.dept })

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  })
})

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = asyncHandler(async (req, res, next) => {
  // Get total count
  const total = await User.countDocuments()

  // Get active users count
  const activeUsers = await User.countDocuments({ status: "active" })

  // Get counts by role
  const roles = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }])

  // Get counts by department
  const departments = await User.aggregate([
    { $match: { department: { $ne: null } } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])

  res.status(200).json({
    success: true,
    data: {
      total,
      activeUsers,
      roles: roles.map((r) => ({ role: r._id, count: r.count })),
      departments: departments.map((d) => ({ department: d._id, count: d.count })),
    },
  })
})
