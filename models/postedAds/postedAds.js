import mongoose from "mongoose";

/**
 * Posted Ads 
 */
export const requiredPostedAdSchemaObject = {
  "post_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreative'
  },
  "message_id": Number,
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }
}

export const postedAdSchemaDescription = {
  "message_id": "Telegram message ID",
  "channel_id": "Channel ID",
  "post_creative_id": "Post creative ID"
}

const postSchema = mongoose.Schema({
  ...requiredPostedAdSchemaObject,
  "is_pinned": { type: Boolean, default: false },
  "pinned_timestamp": Date,
  "unpinned_timestamp": Date,
  "is_deleted": { type: Boolean, default: false },
  "reactions": []
}, {
  timestamps: true,
})

const PostedAd = mongoose.model('PostedAd', postSchema)

export default PostedAd

