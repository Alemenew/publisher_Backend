import mongoose from "mongoose";


export const requiredConversionBotSchemaObject = {
  "username": String,
  "token": String,
  "campaign_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }
}

export const requiredConversionBotSchemaDescription = {
  "username": "Bot Username",
  "token": "Bot Token",
  "campaign_id": "Campaign ID"
}

const conversionBotSchema = mongoose.Schema({
  ...requiredConversionBotSchemaObject,
  "is_active": { type: Boolean, default: true }
}, {
  timestamps: true,
})

const ConversionBot = mongoose.model('ConversionBot', conversionBotSchema)

export default ConversionBot

