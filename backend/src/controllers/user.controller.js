import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ===================== GenerateTokens =====================
const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "User ID is required to generate tokens");
  }
  const accessToken = user.generateAccessToken();
  console.log("Access Token generated:", accessToken);

  const refreceToken = user.generateRefreceToken();
  console.log("Refresh Token generated:", refreceToken);
  if (!accessToken || !refreceToken) {
    throw new ApiError(500, "Token generation failed");
  }

  // Save refresh token to user
  user.refreceToken = refreceToken;
  user.save({ validateBeforeSave: false });
  return { accessToken, refreceToken };
};

// ===================== REGISTER USER =====================
export const registerUser = asyncHandler(async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body;

    // 1. Validate required fields
    if ([fullname, username, email, password].some((field) => !field?.trim())) {
      throw new ApiError(400, "All fields are required");
    }

    // 2. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    // 3. Password strength check
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new ApiError(
        400,
        "Password must be at least 8 characters long, contain one uppercase, one lowercase, one number, and one special character"
      );
    }

    // 4. Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      throw new ApiError(409, "User with email or username already exists");
    }

    // 5. Avatar check and upload
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    const avatarUploadResult = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarUploadResult?.secure_url) {
      throw new ApiError(400, "Avatar upload failed");
    }

    // 6. Create new user
    const user = await User.create({
      fullname,
      username,
      email,
      password,
      avatar: avatarUploadResult.secure_url,
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreceToken"
    );

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("User registration error:", error);

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

// ===================== LOGIN USER =====================
export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (!existingUser) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordMatch = await existingUser.isPassMatch(password);

    if (!isPasswordMatch) {
      throw new ApiError(401, "Invalid password");
    }

    // Generate tokens
    const { accessToken, refreceToken } = await generateTokens(
      existingUser._id
    );
    console.log("cont Access Token:", accessToken);
    console.log("cont Refresh Token:", refreceToken);

    const userData = await User.findById(existingUser._id).select(
      "-password -refreceToken"
    );
    if (!userData) {
      throw new ApiError(404, "User data not found");
    }

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    };

    return res
      .status(200)
      .cookie("refreshToken", refreceToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { user: userData, accessToken, refreceToken },
          "User logged in successfully"
        )
      );
  } catch (error) {
    console.error("User login error:", error);

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

// ===================== LOGOUT USER =====================
export const logoutUser = asyncHandler(async (req, res) => {
  try {
    // Clear cookies
    await User.findByIdAndUpdate(
      req.user.id,
      { refreceToken: "" },
      { new: true }
    );
    console.log("refreceToken cleared for user:", req.user.refreceToken);

    const Options = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    };
    return res
      .status(200)
      .clearCookie("refreshToken", Options)
      .clearCookie("accessToken", Options)
      .json(new ApiResponse(200, null, "User logged out successfully"));
  } catch (error) {
    console.error("User logout error:", error);

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
});

// ===================== RefreshAccessToken =====================

export const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.headers.authorization?.split(" ")[1];
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }
    console.log("Incoming Refresh Token:", incomingRefreshToken);
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("Decoded Refresh Token:", decodedToken);
    if (!decodedToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const user = await User.findById(decodedToken?.id).select(
      "-password -refreceToken"
    );
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.refreceToken !== incomingRefreshToken) {
      throw new ApiError(403, "Refresh token does not match");
    }
    const { accessToken, refreceToken } = await generateTokens(user._id);
    console.log("New Access Token:", accessToken);
    console.log("New Refresh Token:", refreceToken);
    // Set new tokens in cookies
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    };
    return res
      .status(200)
      .cookie("refreshToken", refreceToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreceToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    console.error("Refresh access token error:", error);

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during token refresh",
    });
  }
});

// ===================== Change user password =====================

export const changeUserPassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword, conformPassword } = req.body;
    if (!(newPassword == conformPassword)) {
      throw new ApiError(401, "password is incorrect");
    }
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current and new passwords are required");
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const isCurrentPasswordMatch = await user.isPassMatch(currentPassword);
    if (!isCurrentPasswordMatch) {
      throw new ApiError(401, "Current password is incorrect");
    }
    // Password strength check
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new ApiError(
        400,
        "New password must be at least 8 characters long, contain one uppercase, one lowercase, one number, and one special character"
      );
    }
    user.password.newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(202)
      .json(new ApiResponse(200, "Password updated successfully"));
  } catch (error) {
    console.error("Password updation error:", error);

    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during updation of password",
    });
  }
});

// ===================== Update Account details =====================

export const updateAccountDatails = asyncHandler(async (req, res) => {
  const { email, fullname } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndDelete(
    req.user.id,
    {
      email,
      fullname,
    },
    { new: true }
  ).select("-password", "refreceToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details Updated successfully"));
});

// ===================== Get Current user =====================

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "User not authenticated"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched successfully"));
});

// ===================== Update user profile =====================

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  console.log(avatarLocalPath);
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.secure_url) {
    throw new ApiError(400, "Error while uploading profile");
  }
  const updatedProfile = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        avatar: avatar.secure_url,
      },
    },
    { new: true }
  ).select("-password", "-refreceToken");
  return res
    .status(200)
    .json(new ApiResponse(200, "User profile updated successfully"));
});
