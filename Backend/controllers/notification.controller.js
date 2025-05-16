const asyncHandler = require("../middlewares/asyncHandler")
const ErrorResponse = require("../utils/errorResponse")
const Notification = require("../models/Notification")

// @desc    Get all notifications (admin)
// @route   GET /api/notifications/admin
// @access  Private/Admin
exports.getNotifications = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: [],
  })
})

// @desc    Get single notification (admin)
// @route   GET /api/notifications/admin/:id
// @access  Private/Admin
exports.getNotification = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private/Admin
exports.createNotification = asyncHandler(async (req, res, next) => {
  res.status(201).json({
    success: true,
    data: {},
  })
})

// @desc    Update notification
// @route   PUT /api/notifications/admin/:id
// @access  Private/Admin
exports.updateNotification = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 })
  res.status(200).json({
    success: true,
    data: notifications,
  })
})
