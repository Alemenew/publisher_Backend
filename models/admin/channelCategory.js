import mongoose from "mongoose";

/**
 * Channel Categories
 */

export const requiredChannelCategorySchemaObject = {
  "category_key": String,
  "category_value": String
}

export const channelCategorySchemaObjectDescription = {
  "category_key": "Category key",
  "category_value": "Category value"
}

const ChannelCategorySchema = mongoose.Schema({
  ...requiredChannelCategorySchemaObject
},{
  timestamps: true,
})

export const ChannelCategory = mongoose.model('ChannelCategory', ChannelCategorySchema)




