const jwt = require("jsonwebtoken")
const asyncHandler = require("./asyncHandler")
const ErrorResponse = require("../utils/errorResponse")
const User = require("../models/User")

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1]
    // Set token from cookie
  } else if (req.cookies.token) {
    token = req.cookies.token
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = await User.findById(decoded.id)

    next()
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401))
  }
})

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403))
    }
    next()
  }
}

// Check if user has specific permission
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    // For simplicity, we'll just check roles
    // In a real app, you'd check against a permissions array in the user model
    if (req.user.role === "admin") {
      return next() // Admin has all permissions
    }

    if (req.user.role === "manager") {
      // Manager permissions
      const managerPermissions = [
        "view_all_requests",
        "approve_request",
        "reject_request",
        "view_reports",
        "manage_items",
        "submit_request",
        "return_item",
      ]

      if (managerPermissions.includes(permission)) {
        return next()
      }
    }

    if (req.user.role === "user") {
      // Regular user permissions
      const userPermissions = ["submit_request", "view_own_requests", "return_item"]

      if (userPermissions.includes(permission)) {
        return next()
      }
    }

    return next(new ErrorResponse(`You don't have permission to perform this action`, 403))
  }
}
