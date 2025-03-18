import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()

// when someone visits register, few checks needs to be done, then the control should pass to registerUser
router.route("/register").post(
upload.fields([
  {
    name:"avatar",
    maxCount:1
  },
  {
    name:"coverImage",
    maxCount:1
  }
]),
    registerUser
)

export default router