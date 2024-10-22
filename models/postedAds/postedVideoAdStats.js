import mongoose from "mongoose";

/**
 * PostedAd Stats
 */

export const requiredPostedVideoAdStatsSchemaObject = {
  "views": Number,
  "share": Number,
  "like":Number,
  "comment":Number,
  "posted_video_ad_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostedVideoAd'
  },

}

export const postedVideoAdStatsSchemaDescription = {
  "views": "View count",
  "share": "share count",
  "posted_video_ad_id": "Posted Ad ID",
  "like": "Like count",
  "comment": "Comment count",

}

const postedVideoAdStatSchema = mongoose.Schema({
  ...requiredPostedVideoAdStatsSchemaObject,
  "views_list": Array,
  "share_list": Array,
  "recorded_at_timestamps": Array
}, {
  timestamps: true,
})

const PostedVideoAdStats = mongoose.model('PostedVideoAdStats', postedVideoAdStatSchema)
export default PostedVideoAdStats