const asyncHandler = require("../middlewares/asyncHandler")
const ErrorResponse = require("../utils/errorResponse")
const BorrowRequest = require("../models/BorrowRequest")
const Item = require("../models/Item")
const Notification = require("../models/Notification")
const User = require("../models/User")

// @desc    Get all borrow requests
// @route   GET /api/borrow
// @access  Private/Admin
exports.getBorrowRequests = asyncHandler(async (req, res, next) => {
  const borrowRequests = await BorrowRequest.find()
    .populate({
      path: "user",
      select: "name email department position",
    })
    .populate({
      path: "item",
      select: "name description category status image",
    })
  res.status(200).json({ success: true, data: borrowRequests })
})

// @desc    Get single borrow request
// @route   GET /api/borrow/:id
// @access  Private
exports.getBorrowRequest = asyncHandler(async (req, res, next) => {
  const borrowRequest = await BorrowRequest.findById(req.params.id)
    .populate({
      path: "user",
      select: "name email department position",
    })
    .populate({
      path: "item",
      select: "name description category status image",
    })

  if (!borrowRequest) {
    return next(new ErrorResponse(`Borrow request not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is request owner or admin/manager
  if (borrowRequest.user._id.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "manager") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this request`, 401))
  }

  res.status(200).json({
    success: true,
    data: borrowRequest,
  })
})

// @desc    Create new borrow request
// @route   POST /api/borrow
// @access  Private
exports.createBorrowRequest = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id

  // Validate dates
  const startDate = new Date(req.body.startDate)
  const endDate = new Date(req.body.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (startDate < today) {
    return next(new ErrorResponse(`Start date cannot be in the past`, 400))
  }

  if (endDate < startDate) {
    return next(new ErrorResponse(`End date must be after start date`, 400))
  }

  // Check if item exists and is available
  const item = await Item.findById(req.body.item)

  if (!item) {
    return next(new ErrorResponse(`Item not found with id of ${req.body.item}`, 404))
  }

  // For multi-quantity items, check availableQuantity
  if (item.quantity > 1) {
    if (item.availableQuantity <= 0) {
      return next(new ErrorResponse(`Item is not available for borrowing`, 400))
    }
  } else {
    // For single-quantity items, check status
    if (item.status !== "available") {
      return next(new ErrorResponse(`Item is not available for borrowing`, 400))
    }
  }

  // Create borrow request
  const borrowRequest = await BorrowRequest.create({ ...req.body, user: req.user.id })

  // Find all admins
  const admins = await User.find({ role: "admin" })
  const notifications = admins.map(admin => ({
    recipient: admin._id,
    title: "New Borrow Request",
    message: `${req.user.name} requested to borrow **${item.name}**`,
    type: "borrow_request",
    relatedTo: borrowRequest._id,
    actor: req.user._id, // Add actor for avatar
    item: item._id,
  }))
  await Notification.insertMany(notifications)

  res.status(201).json({
    success: true,
    data: borrowRequest,
  })
})

// @desc    Update borrow request
// @route   PUT /api/borrow/:id
// @access  Private
exports.updateBorrowRequest = asyncHandler(async (req, res, next) => {
  let borrowRequest = await BorrowRequest.findById(req.params.id)

  if (!borrowRequest) {
    return next(new ErrorResponse(`Borrow request not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is request owner or admin/manager
  if (borrowRequest.user.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "manager") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this request`, 401))
  }

  // Don't allow updating status directly through this route
  if (req.body.status) {
    delete req.body.status
  }

  borrowRequest = await BorrowRequest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: borrowRequest,
  })
})

// @desc    Delete borrow request
// @route   DELETE /api/borrow/:id
// @access  Private
exports.deleteBorrowRequest = asyncHandler(async (req, res, next) => {
  const borrowRequest = await BorrowRequest.findById(req.params.id)

  if (!borrowRequest) {
    return next(new ErrorResponse(`Borrow request not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is request owner or admin
  if (borrowRequest.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this request`, 401))
  }

  // Only allow deleting if status is 'pending'
  if (borrowRequest.status !== "pending") {
    return next(new ErrorResponse(`Cannot delete request that is not in 'pending' status`, 400))
  }

  // Update item status back to 'available'
  await Item.findByIdAndUpdate(borrowRequest.item, { status: "available" })

  await borrowRequest.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Approve borrow request
// @route   PUT /api/borrow/:id/approve
// @access  Private/Admin
exports.approveBorrowRequest = asyncHandler(async (req, res, next) => {
  const borrowRequest = await BorrowRequest.findById(req.params.id)

  if (!borrowRequest) {
    return next(new ErrorResponse(`Borrow request not found with id of ${req.params.id}`, 404))
  }

  // Check if request is already approved or rejected
  if (borrowRequest.status !== "pending") {
    return next(new ErrorResponse(`This request has already been ${borrowRequest.status}`, 400))
  }

  // Update request status to approved
  borrowRequest.status = "approved"
  borrowRequest.approvedBy = req.user.id
  borrowRequest.approvalDate = Date.now()
  await borrowRequest.save()

  // Update item status to 'borrowed' and decrement availableQuantity
  const item = await Item.findById(borrowRequest.item)
  if (item.availableQuantity !== undefined) {
    item.availableQuantity = Math.max(0, item.availableQuantity - 1)
    // Optionally, set status to borrowed if all units are out
    if (item.availableQuantity === 0) {
      item.status = "borrowed"
    }
    await item.save()
  } else {
    await Item.findByIdAndUpdate(borrowRequest.item, { status: "borrowed" })
  }

  await Notification.create({
    recipient: borrowRequest.user,
    title: "Borrow Approved",
    message: `Your request for **${item.name}** was approved`,
    type: "borrow_approved",
    relatedTo: borrowRequest._id,
    actor: req.user._id, // admin
    item: item._id,
  })

  res.status(200).json({
    success: true,
    data: borrowRequest,
  })
})

// @desc    Reject borrow request
// @route   PUT /api/borrow/:id/reject
// @access  Private/Admin
exports.rejectBorrowRequest = asyncHandler(async (req, res, next) => {
  const borrowRequest = await BorrowRequest.findById(req.params.id)

  if (!borrowRequest) {
    return next(new ErrorResponse(`Borrow request not found with id of ${req.params.id}`, 404))
  }

  // Check if request is already approved or rejected
  if (borrowRequest.status !== "pending") {
    return next(new ErrorResponse(`This request has already been ${borrowRequest.status}`, 400))
  }

  // Make sure rejection reason is provided
  if (!req.body.rejectionReason) {
    return next(new ErrorResponse(`Please provide a reason for rejection`, 400))
  }

  // Update request status to rejected
  borrowRequest.status = "rejected"
  borrowRequest.rejectionReason = req.body.rejectionReason
  await borrowRequest.save()

  // Update item status back to 'available'
  await Item.findByIdAndUpdate(borrowRequest.item, { status: "available" })

  const item = await Item.findById(borrowRequest.item)
  await Notification.create({
    recipient: borrowRequest.user,
    title: "Borrow Rejected",
    message: `Your request for **${item.name}** was rejected`,
    type: "borrow_rejected",
    relatedTo: borrowRequest._id,
    actor: req.user._id, // admin
    item: item._id,
    reason: borrowRequest.rejectionReason, // <-- Add this line
  })

  res.status(200).json({
    success: true,
    data: borrowRequest,
  })
})

// @desc    Return borrowed item
// @route   PUT /api/borrow/:id/return
// @access  Private
exports.returnBorrowedItem = asyncHandler(async (req, res, next) => {
  const borrowRequest = await BorrowRequest.findById(req.params.id)

  if (!borrowRequest) {
    return next(new ErrorResponse(`Borrow request not found with id of ${req.params.id}`, 404))
  }

  // Check if request is approved (item is borrowed)
  if (borrowRequest.status !== "approved") {
    return next(new ErrorResponse(`This item cannot be returned because it is not currently borrowed`, 400))
  }

  // Make sure user is request owner or admin/manager
  if (borrowRequest.user.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "manager") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to return this item`, 401))
  }

  // Update request status to returned
  borrowRequest.status = "returned"
  borrowRequest.actualReturnDate = Date.now()

  // Make sure returnCondition is valid
  const validConditions = ["excellent", "good", "fair", "poor", "damaged", "same", "lost"]
  borrowRequest.returnCondition = validConditions.includes(req.body.returnCondition) ? req.body.returnCondition : "same"

  borrowRequest.returnNotes = req.body.returnNotes || ""
  await borrowRequest.save()

  // Update item status back to 'available' and increment availableQuantity
  const item = await Item.findById(borrowRequest.item)
  if (item.availableQuantity !== undefined) {
    item.availableQuantity = item.availableQuantity + 1
    item.status = "available"
    await item.save()
  } else {
    await Item.findByIdAndUpdate(borrowRequest.item, { status: "available" })
  }

  res.status(200).json({
    success: true,
    data: borrowRequest,
  })
})

// @desc    Cancel borrow request
// @route   PUT /api/borrow/:id/cancel
// @access  Private
exports.cancelBorrowRequest = asyncHandler(async (req, res, next) => {
  let borrowRequest = await BorrowRequest.findById(req.params.id)

  if (!borrowRequest) {
    return next(new ErrorResponse(`Borrow request not found with id of ${req.params.id}`, 404))
  }

  // Check if request is pending
  if (borrowRequest.status !== "pending") {
    return next(new ErrorResponse(`Only pending requests can be cancelled`, 400))
  }

  // Make sure user is request owner or admin/manager
  if (borrowRequest.user.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "manager") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to cancel this request`, 401))
  }

  // Update request status
  borrowRequest = await BorrowRequest.findByIdAndUpdate(
    req.params.id,
    {
      status: "cancelled",
    },
    {
      new: true,
      runValidators: true,
    },
  )

  res.status(200).json({
    success: true,
    data: borrowRequest,
  })
})

// @desc    Get borrow requests for a specific user
// @route   GET /api/borrow/user/:userId
// @access  Private/Admin
exports.getUserBorrowRequests = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId)

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.userId}`, 404))
  }

  const borrowRequests = await BorrowRequest.find({ user: req.params.userId })
    .populate({
      path: "item",
      select: "name description category status image",
    })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: borrowRequests.length,
    data: borrowRequests,
  })
})

// @desc    Get user's active borrowings
// @route   GET /api/borrow/me/active
// @access  Private
exports.getMyActiveBorrowings = asyncHandler(async (req, res, next) => {
  const borrowings = await BorrowRequest.find({
    user: req.user.id,
    status: { $in: ["approved", "active"] },
  })
    .populate({
      path: "item",
      select: "name category status image",
    })
    .sort({ startDate: -1 })

  res.status(200).json({
    success: true,
    count: borrowings.length,
    data: borrowings,
  })
})

// @desc    Get user's borrowing history
// @route   GET /api/borrow/me/history
// @access  Private
exports.getMyBorrowingHistory = asyncHandler(async (req, res, next) => {
  const borrowings = await BorrowRequest.find({
    user: req.user.id,
  })
    .populate({
      path: "item",
      select: "name category status image",
    })
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: borrowings.length,
    data: borrowings,
  })
})

// @desc    Get borrow statistics
// @route   GET /api/borrow/stats
// @access  Private/Admin/Manager
exports.getBorrowStats = asyncHandler(async (req, res, next) => {
  // Get total count
  const total = await BorrowRequest.countDocuments()

  // Get pending count
  const pending = await BorrowRequest.countDocuments({ status: "pending" })

  // Get approved count
  const approved = await BorrowRequest.countDocuments({ status: "approved" })

  // Get active count
  const active = await BorrowRequest.countDocuments({ status: "active" })

  // Get returned count
  const returned = await BorrowRequest.countDocuments({ status: "returned" })

  // Get rejected count
  const rejected = await BorrowRequest.countDocuments({ status: "rejected" })

  // Get cancelled count
  const cancelled = await BorrowRequest.countDocuments({ status: "cancelled" })

  // Get overdue count
  const overdue = await BorrowRequest.countDocuments({
    status: { $in: ["approved", "active"] },
    endDate: { $lt: new Date() },
  })

  res.status(200).json({
    success: true,
    data: {
      total,
      pending,
      approved,
      active,
      returned,
      rejected,
      cancelled,
      overdue,
    },
  })
})

// @desc    Get recent activity
// @route   GET /api/borrow/recent-activity
// @access  Private/Admin/Manager
exports.getRecentActivity = asyncHandler(async (req, res, next) => {
  const recentActivity = await BorrowRequest.find()
    .populate({
      path: "user",
      select: "name email",
    })
    .populate({
      path: "item",
      select: "name category",
    })
    .sort({ updatedAt: -1 })
    .limit(10)

  // Format the activity for display
  const formattedActivity = recentActivity.map((request) => {
    let action = request.status
    if (request.status === "pending") action = "requested"
    if (request.status === "approved") action = "borrowed"

    return {
      _id: request._id,
      user: request.user,
      item: request.item,
      action,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }
  })

  res.status(200).json({
    success: true,
    count: formattedActivity.length,
    data: formattedActivity,
  })
})

// @desc    Create new item
exports.createItem = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id

  // Set availableQuantity = quantity
  if (typeof req.body.quantity === "number") {
    req.body.availableQuantity = req.body.quantity
  }

  // ...existing code...
})
