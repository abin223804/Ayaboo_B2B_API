import jwt from "jsonwebtoken";
import User from '../model/user.js'
import Admin from "../model/admin.js";


const authenticateUser = async (req, res, next) => {
  let token =
  req.cookies["us_b2b_tkn"] ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  console.log("user token:", token);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_USER);
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user not found.",
      });
    }

    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "User is blocked.",
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authorized, token failed.",
      error: error.message,
    });
  }
};

const authenticateAdmin = async (req, res, next) => {
  let token =
    req.cookies["admin-token"] ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  console.log("Admin Token:", token);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
    req.admin = await Admin.findById(decoded.adminId).select("-password");
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, admin not found.",
      });
    }
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authorized, token failed.",
      error: error.message,
    });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.admin) {
    next();
  } else if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: "Not authorized as an admin.",
    });
  }
};


export { authenticateUser, authenticateAdmin, authorizeAdmin };
