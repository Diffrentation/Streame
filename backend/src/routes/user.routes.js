import express from "express";
import {upload} from "../middlewares/multer.middleware.js";
import { registerUser } from "../controllers/user.controller.js";
import { loginUser } from "../controllers/user.controller.js";
import { logoutUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

const router = express.Router();
// Route with middleware pipeline
router.post("/register", upload.single("avatar"),registerUser);
router.post("/login",loginUser);
router.post("/logout", authMiddleware,logoutUser);
router.post("/refreshlogin",refreshAccessToken);

export default router;