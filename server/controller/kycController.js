// import asyncHandler from "../middleware/asyncHandler";
import Kyc from "../model/kyc.js";
import { KycUpload } from "../config/kycUpload.js";
import Notification from "../model/notification.js";
import User from "../model/user.js";
import asyncHandler from "../middleware/asyncHandler.js";

const submitKyc = async (req, res) => {
  KycUpload(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err.message);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "File upload failed or no file uploaded" });
    }

    const basePath = `${req.secure ? "https" : "http"}://${req.get(
      "host"
    )}/public/uploads`;

    const fileUrl = `${basePath}/${req.file.filename}`;

    try {
      const newKYC = new Kyc({
        businessName: req.body.businessName,
        emailId: req.body.emailId,
        buildingName: req.body.buildingName,
        street: req.body.street,
        post: req.body.post,
        pincode: req.body.pincode,
        state: req.body.state,
        country: req.body.country,
        proof: fileUrl,
        proofType: req.body.proofType,
        userId: req.user.userId,
      });

      const savekyc = await newKYC.save();
      if (savekyc) {
        await Notification.create({
          type: "kyc_submitted",
          message: `A new KYC has been submitted: ${savekyc.businessName}`,
          recipientType: "admin",
          relatedUser: savekyc._id,
        });
      }

      return res.status(200).json({ message: "KYC submitted successfully!" });
    } catch (error) {
      console.error("Internal Server Error:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  });
};



// admin approv kyc - function below

const approveKyc = asyncHandler(async (req, res) => {
  const { kycId } = req.params;

  try {
    const kycRecord = await Kyc.findById(kycId);

    if (!kycRecord) {
      return res.status(404).json({ message: "KYC record not found" });
    }

    if (kycRecord.isApproved) {
      return res.status(400).json({ message: "KYC is already approved" });
    }

    kycRecord.status = 'approved';
    kycRecord.isApproved = true;
    await kycRecord.save();

    const relatedUser = await User.findById(kycRecord.userId);
    if (relatedUser) {
      relatedUser.kycApproved = true;
      await relatedUser.save();

      await Notification.create({
        type: "kyc_approved",
        message: `Your KYC has been approved for ${kycRecord.businessName}.`,
        recipientType: "user",
        relatedUser: relatedUser._id,
      });
    }
    return res.status(200).json({ message: "KYC approved successfully!" });
  } catch (error) {
    console.error("Error approving KYC:", error.message);

    return res.status(500).json({ message: "Internal server error" });
  }
});



const rejectKyc =asyncHandler( async (req, res) => {
  const { kycId } = req.params;
  const { reason } = req.body;

  try {
    const kycRecord = await Kyc.findById(kycId);

    if (!kycRecord) {
      return res.status(404).json({ message: "KYC record not found" });
    }

    kycRecord.status = 'rejected';
    kycRecord.rejectionReason = reason || "No reason provided";
    kycRecord.isApproved = false;
    await kycRecord.save();

    const relatedUser = await User.findById(kycRecord.userId);
    if (relatedUser) {
      relatedUser.kycApproved = false;
      await relatedUser.save();

      await Notification.create({
        type: "kyc_rejected",
        message: `Your KYC for ${kycRecord.businessName} has been rejected. Reason: ${kycRecord.rejectionReason}`,
        recipientType: "user",
        relatedUser: relatedUser._id,
      });



    }

    return res.status(200).json({
      message: "KYC rejected successfully!",
      reason: kycRecord.rejectionReason,
    });
  } catch (error) {
    console.error("Error rejecting KYC:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});







export default {
  submitKyc,
  approveKyc,
  rejectKyc ,
};
