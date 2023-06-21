import express from "express";
const vendorAreaRouter = express.Router()
import { vendor_select_area, vendor_service_area_list, check_vendor_service_avaibility } from "../controllers/vendorAreaController.js";
import { admin_auth } from "../../middleware/auth.js";


vendorAreaRouter.post("/vendor_select_area", admin_auth, vendor_select_area)
vendorAreaRouter.post("/vendor_service_area_list", vendor_service_area_list)
vendorAreaRouter.post("/check_vendor_service_avaibility", check_vendor_service_avaibility)

// vendorAreaRouter.get()
// vendorAreaRouter.put()


export default vendorAreaRouter