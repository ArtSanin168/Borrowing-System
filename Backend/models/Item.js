const mongoose = require("mongoose")

const ItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
      enum: ["laptop", "phone", "tablet", "monitor", "accessory", "other"],
      default: "other",
    },
    serialNumber: {
      type: String,
      trim: true,
      // Removed unique constraint to allow empty or N/A values
    },
    status: {
      type: String,
      enum: ["available", "borrowed", "maintenance", "retired"],
      default: "available",
    },
    condition: {
      type: String,
      enum: ["new", "good", "fair", "poor"],
      default: "good",
    },
    location: {
      type: String,
      trim: true,
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Updated image field to store Cloudinary data
    image: {
      public_id: String,
      url: String,
      contentType: String,
    },
    specs: [
      {
        name: String,
        value: String,
      },
    ],
    notes: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for borrowing history
ItemSchema.virtual("borrowHistory", {
  ref: "BorrowRequest",
  localField: "_id",
  foreignField: "item",
  justOne: false,
})

module.exports = mongoose.model("Item", ItemSchema)
