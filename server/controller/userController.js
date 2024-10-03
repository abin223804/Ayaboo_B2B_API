
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import dotenv from "dotenv";
import axios from "axios";
import User from "../model/user.js";
import Notification from "../model/notification.js";
import Otp from '../model/otp.js'
import asyncHandler from "../middleware/asyncHandler.js";

dotenv.config();

const sendOtp = asyncHandler(async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Please provide a mobile number.' });
    }

    const user = await User.findOne({ mobile });

    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: 'User already exists and is verified.' });
      }
    } else {
      const newUser = new User({ mobile });
      await newUser.save();
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const mobileNumber = mobile.split('-')[1]; // Extract the numeric portion only

    const options = {
      message: '157770',
      variables_values: otp,
      numbers: [mobileNumber], // Send only the extracted number to Fast2SMS
      route: 'dlt',
      sender_id: process.env.SENDER_ID,
      flash: '0',
      language: 'english',
    };

    const response = await axios.get(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=${options.route}&message=${options.message}&language=${options.language}&flash=${options.flash}&numbers=${options.numbers.join(",")}&sender_id=${options.sender_id}&variables_values=${options.variables_values}`
    );

    if (!response.data.return) {
      return res.status(500).json({ success: false, message: response.data.message || 'Error sending OTP via Fast2SMS' });
    }

    // Save the OTP entry
    const otpEntry = new Otp({
      mobile,
      otp,
    });

    await otpEntry.save();

    return res.status(200).json({ success: true, message: 'OTP sent successfully', user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const otpEntry = await Otp.findOne({ mobile, otp });

    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'OTP has expired or is invalid.' });
    }

    await Otp.deleteOne({ _id: otpEntry._id });

    const user = await User.findOne({ mobile });
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    return res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const resendOtp = asyncHandler(async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Please provide a mobile number.' });
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found. Please register first.' });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const mobileNumber = mobile.split('-')[1]; 

    const options = {
      message: '157770',
      variables_values: otp,
      numbers: [mobileNumber], 
      route: 'dlt',
      sender_id: process.env.SENDER_ID,
      flash: '0',
      language: 'english',
    };

    const response = await axios.get(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=${options.route}&message=${options.message}&language=${options.language}&flash=${options.flash}&numbers=${options.numbers.join(",")}&sender_id=${options.sender_id}&variables_values=${options.variables_values}`
    );

    if (!response.data.return) {
      return res.status(500).json({ success: false, message: response.data.message || 'Error sending OTP via Fast2SMS' });
    }

    await Otp.findOneAndUpdate(
      { mobile },
      { otp, expireAt: Date.now() + 60 * 1000 }, 
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
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
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: 'Please provide a mobile number.' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is not verified. Please complete the verification process.',
      });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const mobileNumber = mobile.split('-')[1];

    const options = {
      message: '157770',
      variables_values: otp,
      numbers: [mobileNumber],
      route: 'dlt',
      sender_id: process.env.SENDER_ID,
      flash: '0',
      language: 'english',
    };

    const response = await axios.get(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=${options.route}&message=${options.message}&language=${options.language}&flash=${options.flash}&numbers=${options.numbers.join(",")}&sender_id=${options.sender_id}&variables_values=${options.variables_values}`
    );

    if (!response.data.return) {
      return res.status(500).json({
        success: false,
        message: response.data.message || 'Error sending OTP via Fast2SMS',
      });
    }

    await Otp.findOneAndUpdate(
      { mobile },
      { otp, expireAt: Date.now() + 60 * 1000 },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});


// verifyOtpForLogin ----------------------------------------------------------------

const verifyOtpForLogin = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide both mobile number and OTP.' });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const otpRecord = await Otp.findOne({ mobile });

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Incorrect OTP or OTP expired.' });
    }

    user.isVerified = true;
    await user.save();

    await Otp.deleteOne({ mobile });

    const token = jwt.sign(
      { userId: user._id, mobile: user.mobile },
      process.env.JWT_SECRET_USER,
      { expiresIn: '30d' }
    );

    res.cookie('us_b2b_tkn', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'Strict',
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully for login.',
      user,
      token,
    });
  } catch (error) {
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
