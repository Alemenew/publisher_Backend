import mongoose from "mongoose";

/**
 * PostedAd Stats
 */

export const requiredPostedAdStatsSchemaObject = {
  "views": Number,
  "forwards": Number,
  "posted_ad_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostedAd'
  }
}

export const postedAdStatsSchemaDescription = {
  "views": "View count",
  "forwards": "Forward count",
  "posted_ad_id": "Posted Ad ID"
}

const postedAdStatSchema = mongoose.Schema({
  ...requiredPostedAdStatsSchemaObject,
  "views_list": Array,
  "forwards_list": Array,
  "recorded_at_timestamps": Array
}, {
  timestamps: true,
})

const PostedAdStats = mongoose.model('PostedAdStats', postedAdStatSchema)
export default PostedAdStats