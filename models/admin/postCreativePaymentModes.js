import mongoose from "mongoose";

export const requiredPostCreativePaymentModeSchemaObject = {
  "name": String,
  "default_price": String
}

export const requiredPostCreativePaymentModeSchemaDescription = {
  "name": "Name",
  "default_price": "Default price value"
}

const postCreativePaymentModeSchema = mongoose.Schema({...requiredPostCreativePaymentModeSchemaObject,
  "update_history": Array
}, {
  timestamps: true,
})

const PostCreativePaymentMode = mongoose.model('PostCreativePaymentMode', postCreativePaymentModeSchema)

export default PostCreativePaymentMode
