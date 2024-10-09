import mongoose from "mongoose";


export const requiredChannelTiersBodyObject = {
  "name": String,
  "KPI": String,
  "value": String
}

export const requiredChannelTiersSchemaObject = {
  "name": String
}
export const requiredChannelTiersSchemaDescription = {
  "name": "Name of tier",
  "KPI": "Key Performance indicator",
  "value": "KPI value is required"
}

const channelTierSchema = mongoose.Schema({
  ...requiredChannelTiersSchemaObject,
  "KPI": Array
}, {
  timestamps: true,
})


const ChannelTier = mongoose.model('channelTierSchema', channelTierSchema)

export default ChannelTier

