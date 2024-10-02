import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
    },
    otp: {
      type: Number,
      unique: true,
      required: true,
    },
    expireAt: {
      type: Date,
      default: Date.now,
      expires: 60,
    },
  },
  {
    timestamps: true,
  }
);

const otpCollection = mongoose.model('Otp', otpSchema);
export default otpCollection;
