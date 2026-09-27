const mongoose = require('mongoose');

/**
 * User Mongoose Schema
 * Represents portal users (Entrepreneurs, Compliance Officers, Regulatory Reviewers)
 * for UdyogSetu Industrial Regulatory Platform.
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      default: 'password123',
      select: false
    },
    role: {
      type: String,
      enum: ['ENTREPRENEUR', 'REGULATORY_OFFICER', 'APPELLATE_AUTHORITY', 'ADMIN'],
      default: 'ENTREPRENEUR'
    },
    businessProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', UserSchema);
