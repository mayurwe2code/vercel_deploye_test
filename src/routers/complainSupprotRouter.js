
import express from "express";
import { add_complain, complain_update, complain_search } from "../controllers/complainSupportController.js";
import { admin_auth, auth_user } from "../../middleware/auth.js"

const complainSupportRouter = express.Router()
complainSupportRouter.post("/add_complain", auth_user, add_complain)
complainSupportRouter.put("/complain_update", admin_auth, complain_update)
complainSupportRouter.post("/complain_search", admin_auth, complain_search)

export default complainSupportRouter;