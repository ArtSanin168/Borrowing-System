const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "general",
    },
    relatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "type", // can reference different models if needed
    },
    read: {
      type: Boolean,
      default: false,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Notification", NotificationSchema)