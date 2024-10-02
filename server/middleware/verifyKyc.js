import User from "../model/user";

const checkKycApproved = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.kycApproved) {
      return res
        .status(403)
        .json({ message: "Access denied. KYC not approved." });
    }

    next();
  } catch (error) {
    console.error("Error checking KYC approval:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default checkKycApproved;
