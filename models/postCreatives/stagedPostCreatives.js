import mongoose from "mongoose";

export const requiredStagedPostCreativeSchemaObject = {
  "post_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreative'
  },
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }
}

export const stagedPostCreativeSchemaDescription = {
  "post_creative_id": "Post creative ID",
  "channel_id": "Channel ID"
}

const stagedPostCreativeSchema = mongoose.Schema({
  ...requiredStagedPostCreativeSchemaObject,
  "staged_at": {
    type: Date,
    default: Date.now
  },
  "approved_at": Date,
  "declined_at": Date,
  "delayed_at": Date,
  "status": {
    type: String,
    enum: ["delayed", "staged", "approved", "declined"],
    default: 'staged'
  },
  "status_record":Array
},{
  timestamps: true,
})


const StagedPostCreative = mongoose.model("StagedPostCreative", stagedPostCreativeSchema)
export default StagedPostCreative

