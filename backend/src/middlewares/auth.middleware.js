import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Access token is required");
    }
    console.log("Access Token:", token);
    
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded Token:", decodedToken);
    if (!decodedToken) {
      throw new ApiError(401, "Invalid access token");
    }
    const user = await User.findById(decodedToken?.id).select(
      "-password -refreceToken"
    );
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});
