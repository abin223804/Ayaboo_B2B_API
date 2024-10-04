import express from "express";
import userController from "../controller/userController.js";
import kycController from "../controller/kycController.js";
import notificationController from "../controller/notificationController.js";
import { KycUpload } from "../config/kycUpload.js";



import {authenticateUser,} from "../middleware/auth.js";


const router = express.Router();

//route for send otp in user registration--------------------------------
router.post("/sendOtp", userController.sendOtp);

//route for otp verification in user registration--------------------------------

router.post("/verifyOtp", userController.verifyOtp);

//route for resend otp  in user registration--------------------------------

router.post("/resendOtp", userController.resendOtp);

//route for register  in user with name,shopName etc registration--------------------------------

router.post("/registerUser", userController.registerUser);

//sendOtp for login--------------------------------

router.post("/sendOtpForLogin", userController.sendOtpForLogin); // use the same for resend

//verifyOtp for login--------------------------------

router.post("/verifyOtpForLogin", userController.verifyOtpForLogin);


//route for submitkyc

// router.post("/submitKyc",authenticateUser, kycController.submitKyc);

router.post(
    "/submitKyc",
    authenticateUser,
    KycUpload,
 
    kycController.submitKyc
  );
  




router.get("/getNotifications/:userId",authenticateUser,notificationController.getUserNotification);



router.put("/markAsRead",authenticateUser,notificationController.markNotificationAsRead)


export default router;

