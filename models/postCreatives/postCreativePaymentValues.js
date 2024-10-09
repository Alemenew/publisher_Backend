import mongoose from "mongoose";

export const requiredPostCreativePaymentBodyObject = {
  "key": String,
  "value": String,
  "post_creative_id": String
}

export const requiredPostCreativePaymentBodyDescription = {
  "key": "Key",
  "value": "Value",
  "post_creative_id": "Post creative ID"
}

const requiredPostCreativePaymentValueSchemaObject = {
  "post_creative_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreative'
  },
  "values": Object,
  "update_history": Array
}

const postCreativePaymentValuesSchema = mongoose.Schema(requiredPostCreativePaymentValueSchemaObject, {
  timestamps: true,
})

const PostCreativePaymentValues = mongoose.model('PostCreativePaymentValues', postCreativePaymentValuesSchema)

export default PostCreativePaymentValues


