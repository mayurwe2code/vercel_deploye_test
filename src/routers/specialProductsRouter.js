import express from "express";
const specialProductsRouter = express.Router()
import { trending_products } from "../controllers/specialProductsController.js";
// import { admin_auth } from "../../middleware/auth.js";


specialProductsRouter.post("/trending_products", trending_products)
// specialProductsRouter.post("/vendor_service_area_list", vendor_service_area_list)
// specialProductsRouter.post("/check_vendor_service_avaibility", check_vendor_service_avaibility)

// vendorAreaRouter.get()
// vendorAreaRouter.put()


export default specialProductsRouter