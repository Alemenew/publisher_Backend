import mongoose from "mongoose";


export const requiredPostedAdForIndividualSchemaObject = {
  "post_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreative'
  },
  "message_id": Number,
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "bot_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IndividualBot'
  }
}

export const postedAdForIndividualSchemaDescription = {
  "message_id": "Telegram message ID",
  "channel_id": "Channel ID",
  "post_creative_id": "Post creative ID"
}

const postedAdForIndividualSchema = mongoose.Schema({
  ...requiredPostedAdForIndividualSchemaObject,
  'reactions': Array,
  "conversion_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConversionCreative'
  },
  "is_conversion": {
    type: Boolean, default: false
  },
  "from_channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }
}, {
  timestamps: true,
})

const PostedAdForIndividual = mongoose.model('PosedAdForIndividual', postedAdForIndividualSchema)
export default PostedAdForIndividual





