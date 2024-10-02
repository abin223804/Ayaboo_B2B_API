import express from 'express';
import adminController from '../controller/adminController.js';
import kycController from '../controller/kycController.js';
import notificationController from '../controller/notificationController.js';
import { authenticateAdmin,authorizeAdmin} from "../middleware/auth.js";

const router = express.Router();

router.post("/loginAdmin", adminController.loginAdmin)

router.post("/approveKyc/:kycId ",authenticateAdmin,authorizeAdmin, kycController.approveKyc)

router.post("/rejectKyc/kycId ",authenticateAdmin,authorizeAdmin, kycController.rejectKyc)

router.get("/getNotifications",authenticateAdmin,authorizeAdmin,notificationController.getAdminNotifications)

router.put("/markAsRead",authenticateAdmin,authorizeAdmin,notificationController.markNotificationAsRead)





export default router;
