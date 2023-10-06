import express from "express";
import {
  createOrder,
  paymentDetails,
  paymentupdate,
  reDataFetch
} from "../controllers/paymentController.js";
import { admin_auth, auth_user, fetch_user } from "../../middleware/auth.js";

// import { auth_user, fetch_user, admin_auth } from '../../middleware/auth.js'

const payment_route = express.Router();
// payment_route.get('/',renderProductPage);
payment_route.post("/createOrder", auth_user, createOrder);
payment_route.put("/paymentupdate", auth_user, paymentupdate);
payment_route.post("/paymentDetails", paymentDetails);
payment_route.post("/reDataFetch",auth_user, reDataFetch);

export default payment_route;
