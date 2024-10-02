
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import dotenv from "dotenv";
import axios from "axios";
import User from "../model/user.js";
import Notification from "../model/notification.js";
import asyncHandler from "../middleware/asyncHandler.js";

dotenv.config();

const sendOtp = asyncHandler(async (req, res) => {
  try {
    const { mobile, mobile4OTP } = req.body;

    console.log("req.body", req.body);

    if (!mobile || !mobile4OTP) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the inputs." });
    }

    const userExist = await User.findOne({ mobile: mobile ,isVerified });

    if (userExist) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log(`Generated OTP: ${otp}`);
    const options = {
      message: "157770",
      variables_values: otp,
      numbers: [mobile4OTP],
      route: "dlt",
      sender_id: process.env.SENDER_ID,
      flash: "0",
      language: "english",
    };

    console.log("Sending request to Fast2SMS with options:", options);

    try {
      const response = await axios.get(
        `https://www.fast2sms.com/dev/bulkV2?authorization=${
          process.env.FAST2SMS_API_KEY
        }&route=${options.route}&message=${options.message}&language=${
          options.language
        }&flash=${options.flash}&numbers=${options.numbers.join(
          ","
        )}&sender_id=${options.sender_id}&entity_id=${
          options.entity_id
        }&variables_values=${options.variables_values}`
      );

      console.log("Response from Fast2SMS:", response.data);

      if (!response.data.return) {
        console.error("Error from Fast2SMS:", response.data);
        return res.status(500).json({
          success: false,
          message: response.data.message || "Error sending OTP via Fast2SMS",
        });
      }
    } catch (error) {
      console.error("Error sending OTP via Fast2SMS:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Error sending OTP" });
    }

    const newUser = new User({
      mobile,
      mobile4OTP,
      otp,
      isVerified
    });

    await newUser.save();

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully", newUser });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  try {
    const { mobile4OTP, otp } = req.body;

    const user = await User.findOne({ mobile4OTP: mobile4OTP });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.otp === otp) {
      user.isVerified = true;
      user.otp = undefined;
      await user.save();

      return res.json({
        success: true,
        message: "OTP verified successfully for Registration",
      });
    }
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const resendOtp = asyncHandler(async (req, res) => {
  try {
    const { mobile, mobile4OTP } = req.body;

    console.log("req.body", req.body);

    if (!mobile || !mobile4OTP) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all the inputs." });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log(`Generated OTP: ${otp}`);
    const options = {
      message: "157770",
      variables_values: otp,
      numbers: [mobile4OTP],
      route: "dlt",
      sender_id: process.env.SENDER_ID,
      flash: "0",
      language: "english",
    };

    console.log("Sending request to Fast2SMS with options:", options);

    try {
      const response = await axios.get(
        `https://www.fast2sms.com/dev/bulkV2?authorization=${
          process.env.FAST2SMS_API_KEY
        }&route=${options.route}&message=${options.message}&language=${
          options.language
        }&flash=${options.flash}&numbers=${options.numbers.join(
          ","
        )}&sender_id=${options.sender_id}&entity_id=${
          options.entity_id
        }&variables_values=${options.variables_values}`
      );

      console.log("Response from Fast2SMS:", response.data);

      if (!response.data.return) {
        console.error("Error from Fast2SMS:", response.data);
        return res.status(500).json({
          success: false,
          message: response.data.message || "Error sending OTP via Fast2SMS",
        });
      }
    } catch (error) {
      console.error("Error sending OTP via Fast2SMS:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Error sending OTP" });
    }

    const newUser = new User({
      mobile,
      mobile4OTP,
      otp,
      isVerified: false,
    });

    await newUser.save();

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully", newUser });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, shopName, pinCode, mobile , isWhatsappApproved } = req.body;
  console.log("req.body", req.body);

  if (!name || !shopName || !pinCode) {
    return res
      .status(400)
      .json({ message: "Name, email, and mobile number are required" });
  }

  try {
    const user = await User.findOne({ mobile });
    console.log("user", user);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "user is not verified by Otp" });
    }

    user.name = name;
    user.shopName = shopName;
    user.pinCode = pinCode;
    user.mobile = mobile;
    user.isWhatsappApproved = isWhatsappApproved;
    user.isVerified = true;

    const newUser = await user.save();

    if (newUser) {
      await Notification.create({
        type: "user_registered",
        message: `A new user has registered: ${newUser.shopName}`,
        recipientType: "admin",
        relatedUser: newUser._id,
      });
    }

    const token = jwt.sign(
      { userId: user._id, mobile: user.mobile },
      process.env.JWT_SECRET_USER,
      { expiresIn: "30d" }
    );
    res.cookie("us_b2b_tkn", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "Strict",
    });

    return res.status(200).json({
      success: true,
      message: "User details registered successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

//login user here --------------------------------

const sendOtpForLogin = asyncHandler(async (req, res) => {
  const { mobile4OTP } = req.body;

  if (!mobile4OTP) {
    return res.status(400).json({ message: "Please provide mobile number" });
  }

  try {
    const user = await User.findOne({ mobile4OTP });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User is not verified. login after verification",
        });
    }
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log(`Generated OTP: ${otp}`);
    const options = {
      message: "157770",
      variables_values: otp,
      numbers: [mobile4OTP],
      route: "dlt",
      sender_id: process.env.SENDER_ID,
      flash: "0",
      language: "english",
    };

    console.log("Sending request to Fast2SMS with options:", options);
    try {
      const response = await axios.get(
        `https://www.fast2sms.com/dev/bulkV2?authorization=${
          process.env.FAST2SMS_API_KEY
        }&route=${options.route}&message=${options.message}&language=${
          options.language
        }&flash=${options.flash}&numbers=${options.numbers.join(
          ","
        )}&sender_id=${options.sender_id}&entity_id=${
          options.entity_id
        }&variables_values=${options.variables_values}`
      );

      console.log("Response from Fast2SMS:", response.data);

      if (!response.data.return) {
        console.error("Error from Fast2SMS:", response.data);
        return res.status(500).json({
          success: false,
          message: response.data.message || "Error sending OTP via Fast2SMS",
        });
      }
    } catch (error) {
      console.error("Error sending OTP via Fast2SMS:", error.message);
      return res
        .status(500)
        .json({ success: false, message: "Error sending OTP" });
    }

    user.otp = otp;
    await user.save();
    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP via Fast2SMS:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Error sending OTP" });
  }
});

// verifyOtpForLogin ----------------------------------------------------------------

const verifyOtpForLogin = asyncHandler(async (req, res) => {
  const { mobile4OTP, otp } = req.body;

  try {
    const user = await User.findOne({ mobile4OTP });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (otp !== user.otp) {
      return res.status(401).json({ success: false, message: "Incorrect OTP" });
    }

    user.isVerified = true;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, mobile: user.mobile },
      process.env.JWT_SECRET_USER,
      { expiresIn: "30d" }
    );
    res.cookie("us_b2b_tkn", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "Strict",
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully for login",
      user,
      token,
    });
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});
 


export default {
  sendOtp,
  verifyOtp,
  resendOtp,
  registerUser,
  sendOtpForLogin,
  verifyOtpForLogin,
};
