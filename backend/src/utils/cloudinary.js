import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  console.log(`Starting upload for file: ${localFilePath}`);

  try {
    // Validate file path
    if (!localFilePath) {
      console.warn("No file path provided");
      return null;
    }
    // Check file exists
    if (!fs.existsSync(localFilePath)) {
      console.error(`File not found at path: ${localFilePath}`);
      return null;
    }

    console.log("Uploading to Cloudinary...");
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("Upload completed:", response);
    console.log("Upload successful:", {
      url: response.secure_url,
      public_id: response.public_id,
      bytes: response.bytes,
    });

    // Clean up local file from ./public/uploads folder
    // fs.unlinkSync(localFilePath);
    // console.log("Local file removed successfully");

    return response;
  } catch (error) {
    console.error("Upload failed:", error.message);

    // Clean up local file if it exists
    if (fs.existsSync(localFilePath)) {
      console.log("Cleaning up local file after failed upload");
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

;
