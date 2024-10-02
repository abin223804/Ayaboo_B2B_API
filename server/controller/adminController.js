import jwt from "jsonwebtoken";
import Admin from "../model/admin.js";
import asyncHandler from "../middleware/asyncHandler.js";

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "please provide  both email and password" });
  }

  try {
    const user = await Admin.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET_Admin,
      { expiresIn: "30d" }
    );

    res.cookie("ad_b2b_tkn", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    res.status(200).json({
      message: "login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);

    return res.status(500).json({ success: false, message: error.message });
  }
});




export default {
  loginAdmin,
};
