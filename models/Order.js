const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
  type: String,
  enum: [
    "pending",
    "shipped",
    "delivered",
    "cancelled",
    "return-requested",
    "returned",
    "refunded"
  ],
  default: "pending",
},
    statusTimeline: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "shipped",
            "delivered",
            "cancelled",
            "return-requested",
            "returned",
            "refunded",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
      refundStatus: {
      type: String,
      default: "not-refunded", // not-refunded | refunded
    },
    cancelledAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    returnedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
  },
  { timestamps: true }
  
);

module.exports = mongoose.model("Order", orderSchema);
