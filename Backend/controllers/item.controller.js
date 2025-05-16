const Item = require("../models/Item")
const BorrowRequest = require("../models/BorrowRequest")
const asyncHandler = require("../middlewares/asyncHandler")
const ErrorResponse = require("../utils/errorResponse")
const cloudinary = require("cloudinary").v2
const path = require("path")
const fs = require("fs")

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dxtgu0i70",
  api_key: process.env.CLOUDINARY_API_KEY || "151812494369346",
  api_secret: process.env.CLOUDINARY_API_SECRET || "D0rvPAol66vjnmSzMeXIcXLq7LM",
})

// @desc    Get all items
// @route   GET /api/items
// @access  Private
exports.getItems = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
exports.getItem = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id).populate({
    path: "borrowHistory",
    select: "user startDate endDate status actualReturnDate",
    populate: {
      path: "user",
      select: "name email",
    },
  })

  if (!item) {
    return next(new ErrorResponse(`Item not found with id of ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: item,
  })
})

// @desc    Create new item
// @route   POST /api/items
// @access  Private
exports.createItem = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id

  // Convert category to lowercase
  if (req.body.category) {
    req.body.category = req.body.category.toLowerCase()
  }

  // Convert status to lowercase
  if (req.body.status) {
    req.body.status = req.body.status.toLowerCase()
  }

  // Convert condition to lowercase
  if (req.body.condition) {
    req.body.condition = req.body.condition.toLowerCase()
  }

  // Check for duplicate serial number if provided and not empty
  if (req.body.serialNumber && req.body.serialNumber !== "N/A") {
    const existingItem = await Item.findOne({ serialNumber: req.body.serialNumber })
    if (existingItem) {
      return next(new ErrorResponse(`Item with serial number ${req.body.serialNumber} already exists`, 400))
    }
  }

  // Create item
  const item = await Item.create(req.body)

  res.status(201).json({
    success: true,
    data: item,
  })
})

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
exports.updateItem = asyncHandler(async (req, res, next) => {
  let item = await Item.findById(req.params.id)

  if (!item) {
    return next(new ErrorResponse(`Item not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is item owner or admin
  if (item.createdBy && item.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this item`, 401))
  }

  // Convert category to lowercase
  if (req.body.category) {
    req.body.category = req.body.category.toLowerCase()
  }

  // Convert status to lowercase
  if (req.body.status) {
    req.body.status = req.body.status.toLowerCase()
  }

  // Convert condition to lowercase
  if (req.body.condition) {
    req.body.condition = req.body.condition.toLowerCase()
  }

  // Check for duplicate serial number if being updated
  if (req.body.serialNumber && req.body.serialNumber !== "N/A" && req.body.serialNumber !== item.serialNumber) {
    const existingItem = await Item.findOne({ serialNumber: req.body.serialNumber })
    if (existingItem) {
      return next(new ErrorResponse(`Item with serial number ${req.body.serialNumber} already exists`, 400))
    }
  }

  item = await Item.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: item,
  })
})

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
exports.deleteItem = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id)

  if (!item) {
    return next(new ErrorResponse(`Item not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is item owner or admin
  if (item.createdBy && item.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this item`, 401))
  }

  // Check if item has active borrow requests
  const activeRequests = await BorrowRequest.countDocuments({
    item: req.params.id,
    status: { $in: ["pending", "approved", "active"] },
  })

  if (activeRequests > 0) {
    return next(new ErrorResponse(`Cannot delete item with active borrow requests`, 400))
  }

  // Delete image from Cloudinary if exists
  if (item.image && item.image.public_id) {
    try {
      await cloudinary.uploader.destroy(item.image.public_id)
    } catch (err) {
      console.error("Error deleting image from Cloudinary:", err)
    }
  }

  await item.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Upload photo for item
// @route   PUT /api/items/:id/photo
// @access  Private
exports.itemPhotoUpload = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id)

  if (!item) {
    return next(new ErrorResponse(`Item not found with id of ${req.params.id}`, 404))
  }

  // Make sure user is item owner or admin
  if (item.createdBy && item.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this item`, 401))
  }

  if (!req.files || !req.files.file) {
    return next(new ErrorResponse(`Please upload a file`, 400))
  }

  const file = req.files.file

  // Make sure the image is a photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload an image file`, 400))
  }

  // Check filesize
  const maxSize = process.env.MAX_FILE_UPLOAD || 1024 * 1024 * 5 // Default 5MB
  if (file.size > maxSize) {
    return next(new ErrorResponse(`Please upload an image less than ${maxSize / (1024 * 1024)}MB`, 400))
  }

  console.log("Processing image upload for item:", item._id)

  try {
    // Create a base64 string from the file data
    const fileStr = `data:${file.mimetype};base64,${file.data.toString("base64")}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileStr, {
      folder: "borrowing-system/items",
      public_id: `item_${item._id}`,
      overwrite: true,
    })

    console.log("Cloudinary upload result:", result)

    // Delete old image if exists
    if (item.image && item.image.public_id && item.image.public_id !== result.public_id) {
      try {
        await cloudinary.uploader.destroy(item.image.public_id)
      } catch (err) {
        console.error("Error deleting old image from Cloudinary:", err)
      }
    }

    // Update the item with the image data
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        image: {
          public_id: result.public_id,
          url: result.secure_url,
          contentType: file.mimetype,
        },
      },
      { new: true },
    )

    console.log("Image uploaded successfully to Cloudinary for item:", updatedItem._id)

    res.status(200).json({
      success: true,
      data: {
        id: updatedItem._id,
        imageUrl: result.secure_url,
        message: "Image uploaded successfully to Cloudinary",
      },
    })
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return next(new ErrorResponse(`Error uploading image: ${error.message}`, 500))
  }
})

// @desc    Get item photo
// @route   GET /api/items/:id/photo
// @access  Public
exports.getItemPhoto = asyncHandler(async (req, res, next) => {
  const item = await Item.findById(req.params.id)

  if (!item) {
    return next(new ErrorResponse(`Item not found with id of ${req.params.id}`, 404))
  }

  // If no image exists, return a default image based on category
  if (!item.image || !item.image.url) {
    // Determine which default image to use based on category
    let defaultImageUrl

    switch (item.category) {
      case "laptop":
        defaultImageUrl =
          "https://res.cloudinary.com/dxtgu0i70/image/upload/v1715271150/borrowing-system/defaults/laptop_default.png"
        break
      case "phone":
        defaultImageUrl =
          "https://res.cloudinary.com/dxtgu0i70/image/upload/v1715271150/borrowing-system/defaults/phone_default.png"
        break
      case "tablet":
        defaultImageUrl =
          "https://res.cloudinary.com/dxtgu0i70/image/upload/v1715271150/borrowing-system/defaults/tablet_default.png"
        break
      case "monitor":
        defaultImageUrl =
          "https://res.cloudinary.com/dxtgu0i70/image/upload/v1715271150/borrowing-system/defaults/monitor_default.png"
        break
      case "accessory":
        defaultImageUrl =
          "https://res.cloudinary.com/dxtgu0i70/image/upload/v1715271150/borrowing-system/defaults/accessory_default.png"
        break
      default:
        defaultImageUrl =
          "https://res.cloudinary.com/dxtgu0i70/image/upload/v1715271150/borrowing-system/defaults/item_default.png"
    }

    return res.redirect(defaultImageUrl)
  }

  // Redirect to the Cloudinary URL
  return res.redirect(item.image.url)
})

// @desc    Get all available items
// @route   GET /api/items/available
// @access  Private
exports.getAvailableItems = asyncHandler(async (req, res, next) => {
  // Add status filter to the query
  req.query.status = "available"
  res.status(200).json(res.advancedResults)
})

// @desc    Get item statistics
// @route   GET /api/items/stats
// @access  Private
exports.getItemStats = asyncHandler(async (req, res, next) => {
  // All items
  const total = await Item.countDocuments()
  // Only non-accessory items for borrowed assets
  const borrowed = await Item.countDocuments({
    status: { $in: ["borrowed", "approved", "active"] },
    category: { $ne: "accessory" }
  })

  // Accessories (populate borrowHistory)
  const accessories = await Item.find({ category: "accessory" }).populate({
    path: "borrowHistory",
    select: "status quantity",
  })

  // Total accessories by quantity
  const totalAccessories = accessories.reduce((sum, item) => sum + (item.quantity || 1), 0)

  // Borrowed accessories by quantity (sum quantity of borrowHistory with status borrowed/approved/active)
  const borrowedAccessories = accessories.reduce((sum, item) => {
    if (!item.borrowHistory || !Array.isArray(item.borrowHistory)) return sum
    // Sum quantity for each borrow record with correct status
    const borrowedQty = item.borrowHistory
      .filter(b => ["borrowed", "approved", "active"].includes(b.status))
      .reduce((q, b) => q + (b.quantity || 1), 0)
    return sum + borrowedQty
  }, 0)

  // Pending requests (all items)
  const pending = await BorrowRequest.countDocuments({ status: "pending" })

  res.status(200).json({
    success: true,
    data: {
      total,
      borrowed,
      pending, // <-- add pending requests back
      totalAccessories,
      borrowedAccessories,
    },
  })
})
