import mongoose from "mongoose";
const { Schema } = mongoose;
import { User } from "./user.model.js";
const SubscriptionSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    plan: {
        type: String,
        required: true,
        enum: ["free", "basic", "premium"],
        default: "free"
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subscribersCount: {
        type: Number,
        default: 0
    },
    
    
    
})