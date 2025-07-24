import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  fullname: {
    type: String,
    required: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
    avatar: {
    type: String,
    // required: true,
    default: "",
  },

  coverImage: {
    type: String,
    // required: true,
    default: "",
  },
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  refreceToken: {
    type: String,
    default: "",
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isPassMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, username: this.username },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreceToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRECE_TOKEN_SECRET, {
    expiresIn: process.env.REFRECE_TOKEN_EXPIRY,
  });
};

const User = mongoose.model("User", userSchema);
export default User;
