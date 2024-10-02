import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    shopName: {
      type: String,
    },
    mobile: {
      type: String,
      required: false,
      minLength: 10,
    },
    mobile4OTP: {
      type: String,
      required: false,
    },
    pinCode: {
      type: String,
      required: false,
    },
 
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    policyVerified: {
      type: Boolean,
      default: false,
    },
    kycApproved: {
      type: Boolean,
      default: false,
    },
    isWhatsappApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("User", userSchema);

export default userModel;
