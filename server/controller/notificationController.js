import Notification from "../model/notification.js";
import asyncHandler from "../middleware/asyncHandler.js";

// get notification for user

const getUserNotification = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await Notification.find({
      relatedUser: userId,
      recipientType: "user",
      isRead: false,
    }).sort({ createdAt: -1 });

    if (!notifications || notifications.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for this user" });
    }
    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// get notification for admin

const getAdminNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientType: "admin",
      isRead: false,
    }).sort({ createdAt: -1 });

    if (!notifications || notifications.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for admin." });
    }

    return res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.body;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ message: "Notification marked as read" });
});

export default {
  getUserNotification,
  getAdminNotifications,
  markNotificationAsRead,
};
