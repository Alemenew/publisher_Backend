import mongoose from "mongoose";


const requiredBotLanguageSchemaObject = {
  "key": String,
  "values": Object
}

export const requiredBotLanguageRequestBodyObject = {
  "key": String,
  "value": String,
  "short_name": String
}

export const requiredBotLanguageRequestBodyDescription = {
  "key": "Key",
  "value": "Value",
  "short_name": "Language short name"
}


const botLanguageSchema = mongoose.Schema(requiredBotLanguageSchemaObject, {
  timestamps: true,
})

const BotLanguages = mongoose.model('BotLanguages', botLanguageSchema)

export default BotLanguages





