import mongoose from "mongoose";

export const requiredPostVideoCreativeSchemaObject = {
  "name": String,
  "platform": Array,
  "selected_creative_type": String,
  "selectedadFormat": String,
  "min_ad_duration":Number,
  "startTime":String,
  "filePath": String,
  "isRequired":Boolean,
  "campaign_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }
}

export const postVideoCreativeSchemaDescription = {
  "name": "Name of the post video creative",
  "description": "description of the video.",
  "platform": "which platform the post video creative belongs to",
  "selected_creative_type": "what type is the post video creative image or video",
  "campaign_id": "Campaign ID",
  "selectedAdFormat": "The animation type of the creative",
 "startTime": "Start time of the ad",
 "endTime": "End time of the ad",
  "min_ad_duration": "The minimum ad duration for the creative to be displayed",
  "filePath": "The file path for the creative"
}

const postVideoCreativeSchema = mongoose.Schema({
  ...requiredPostVideoCreativeSchemaObject,
  "description": String,
  "sticker": Object,
  "is_edited": {
    type: Boolean, default: false
  }
}, {
  timestamps: true,
})

const PostVideoCreative = mongoose.model("PostVideoCreative", postVideoCreativeSchema)
export default PostVideoCreative


