import mongoose from "mongoose";


export const requiredSupportedLanguagesSchemaObject = {
  "short_name": String,
  "name": String,
  "emoji": String
}

export const requiredSupportedLanguagesSchemaDescription = {
  "short_name": "Short name",
  "name": "Name",
  "emoji": "Emoji or flag"
}


const supportedLanguagesSchema = mongoose.Schema(requiredSupportedLanguagesSchemaObject, {
  timestamps: true,
})

const SupportedLanguages = mongoose.model('SupportedLanguages', supportedLanguagesSchema)


export default SupportedLanguages




