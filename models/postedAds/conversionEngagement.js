import mongoose from "mongoose";

export const requiredConversionEngagementSchemaObject = {
  "post_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreative'
  },
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "from_channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }
}

export const conversionEngagementSchemaDescription = {
  "post_creative_id": "Posted creative ID",
  "channel_id": "Channel ID",
  "from_channel_id": "From Channel ID"
}

const conversionEngagementSchema = mongoose.Schema({
  ...requiredConversionEngagementSchemaObject,
  "is_duplicate": {
    type: Boolean, default: false
  }
}, {
  timestamps: true,
})

const ConversionEngagement = mongoose.model('ConversionEngagement', conversionEngagementSchema)

export default ConversionEngagement
