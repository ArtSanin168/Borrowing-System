const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const validator = require("validator")
const crypto = require("crypto")
const { JWT_SECRET, JWT_EXPIRE } = require("../config/config")

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true, // This creates an index automatically
      lowercase: true,
      validate: [validator.isEmail, "Please add a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
      validate: {
        validator: (v) => {
          // Updated regex with better error handling
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v)
        },
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin", "manager"],
      default: "user",
    },
    department: {
      type: String,
      trim: true,
      enum: ["IT", "HR", "Finance", "Operations", "Marketing", "Sales", "Other"],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => /^[\d\-+\s$$$$]{10,15}$/.test(v),
        message: "Please enter a valid phone number",
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationExpire: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Middleware to hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

// Prevent duplicate email errors from being shown as MongoDB errors
UserSchema.post("save", (error, doc, next) => {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Email address already exists"))
  } else {
    next(error)
  }
})

// Method to generate JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE },
  )
}

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Method to generate password reset token
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex")

  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000 // 10 minutes

  return resetToken
}

// Method to generate email verification token
UserSchema.methods.getVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex")

  this.verificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex")

  this.verificationExpire = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

  return verificationToken
}

// Virtual for user's full profile URL (optional)
UserSchema.virtual("profileUrl").get(function () {
  return `/users/${this._id}/profile`
})

// Virtual for counting borrowed assets
UserSchema.virtual("borrowedAssetsCount", {
  ref: "Borrow", // The Borrow model
  localField: "_id",
  foreignField: "user", // The field in Borrow that references User
  count: true,
  match: { status: "approved" }, // Only count currently borrowed assets
})

module.exports = mongoose.model("User", UserSchema)
