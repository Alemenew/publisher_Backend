import mongoose from "mongoose";

/**
 * Posted Ads 
 */
export const requiredPostedVideoAdSchemaObject = {
  "post_video_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostVideoCreative'
  },
  "post_id": String,
  "user_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  }
}

export const postedAdSchemaDescription = {
  "post_id": "Tiktok/Youtube Post Id returned from Tiktok/Youtube post request",
  "user_id": "user ID",
  "post_video_creative_id": "Post video creative ID"
}

const postSchema = mongoose.Schema({
  ...requiredPostedVideoAdSchemaObject,
  "is_pinned": { type: Boolean, default: false },
  "pinned_timestamp": Date,
  "unpinned_timestamp": Date,
  "is_deleted": { type: Boolean, default: false },
  "reactions": []
}, {
  timestamps: true,
})

const PostedVideoAd = mongoose.model('PostedVideoAd', postSchema)

export default PostedVideoAd

