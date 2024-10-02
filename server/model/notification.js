import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "user_registered",
      "kyc_submitted",
      "kyc_approved",
      "kyc_rejected",
      "order_confirmed",
      "order_cancelled",
      "return_requested",
      "return_cancelled",
      "return_rejected",
      "return_confirmed",
      "order_delivered",
      "admin_cancelled_order",
    ],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  recipientType: {
    type: String,
    enum: ["user", "admin"],
    required: true,
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
