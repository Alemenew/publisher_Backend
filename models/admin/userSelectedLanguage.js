import mongoose from "mongoose";


export const requiredUserSelectedLanguageSchemaObject = {
  "user_id": Number,
  "selected_language": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportedLanguages'
  }
}

export const requiredUserSelectedLanguageSchemaDescription = {
  "user_id": "USer ID",
  "selected_language": "Selected Language"
}

const userSelectedLanguageSchema = mongoose.Schema(requiredUserSelectedLanguageSchemaObject, {
  timestamps: true,
})

const UserSelectedLanguage = mongoose.model('UserSelectedLanguage', userSelectedLanguageSchema)

export default UserSelectedLanguage
