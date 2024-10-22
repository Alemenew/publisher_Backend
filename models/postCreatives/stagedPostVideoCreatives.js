import mongoose from "mongoose";

export const requiredStagedPostVideoCreativeSchemaObject = {
  "post_video_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostVideoCreative'
  },
  "user_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
}

export const stagedPostVideoCreativeSchemaDescription = {
  "post_Video_creative_id": "Post video creative ID",
  "user_id": "UserId",

}

const stagedPostVideoCreativeSchema = mongoose.Schema({
  ...requiredStagedPostVideoCreativeSchemaObject,
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


const StagedPostVideoCreative = mongoose.model("StagedPostVideoCreative", stagedPostVideoCreativeSchema)
export default StagedPostVideoCreative

