import mongoose from "mongoose";

/**
 * Engagement Count
 */
export const requiredEngagementCountSchemaObject = {
  "posted_ad_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostedAd'
  },
  "count": Number,
  "req_body": Array,
  "url": String
}

export const engagementCountSchemaDescription = {
  "posted_ad_id": "Posted Ad ID",
  "count": "Engagement count",
  "req_body": "Request body",
  "url": "Engagement URL",
}

const engagementCountSchema = mongoose.Schema({
  ...requiredEngagementCountSchemaObject,
  "engaged_at_list": Array
}
  , {
    timestamps: true,
  }
)

const EngagementCount = mongoose.model('EngagementCount', engagementCountSchema)

export default EngagementCount

