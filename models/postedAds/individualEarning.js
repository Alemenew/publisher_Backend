import mongoose from "mongoose";

export const requiredIndividualEarningBodyObject = {
  "post_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreative'
  },
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "payment_mode_key": String
}

export const requiredIndividualEarningBodyDescription = {
  "post_creative_id": "Post Creative ID",
  "channel_id": "Channel ID",
  "payment_mode_key": "Payment Mode Key"
}


export const requiredIndividualEarningSchemaObject = {
  "post_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreative'
  },
  "channel_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  "payment_mode_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreativePaymentMode'
  },
  "payment": String
}

const individualEarningSchema = mongoose.Schema(requiredIndividualEarningSchemaObject,
  {
    timestamps: true,
  }
)

const IndividualEarning = mongoose.model('IndividualEarning', individualEarningSchema)

export default IndividualEarning


