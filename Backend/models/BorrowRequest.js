const mongoose = require("mongoose")

const BorrowRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, "Please add a start date"],
    },
    endDate: {
      type: Date,
      required: [true, "Please add an end date"],
    },
    actualReturnDate: {
      type: Date,
    },
    purpose: {
      type: String,
      required: [true, "Please add a purpose for borrowing"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "returned", "overdue", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    returnCondition: {
      type: String,
      enum: ["same", "damaged", "lost", "excellent", "good", "fair", "poor"],
      default: "same",
    },
    returnNotes: {
      type: String,
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
  },
  {
    timestamps: true,
  },
)

// Create index for efficient queries
BorrowRequestSchema.index({ user: 1, status: 1 })
BorrowRequestSchema.index({ item: 1, status: 1 })

module.exports = mongoose.model("BorrowRequest", BorrowRequestSchema)
