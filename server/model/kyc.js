import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  emailId: { type: String, required: true },
  buildingName: { type: String, required: true },
  street: { type: String, required: true },
  post: { type: String, required: true },
  pinCode: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  proof: { type: String }, 
  proofType: { 
    type: String, 
    required: true,
    enum: [
      'Udyam Aadhaar',
      'GST Certificate',
      'Current Account Cheque',
      'Shop & Establishment License',
      'Trade Certificate/License',
      'Other Shop Documents'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending', 
  },
  rejectionReason: { type: String },
  isApproved: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
},{ timestamps: true });

export default mongoose.model('KYC', kycSchema);
  