import mongoose from "mongoose";

export const requiredConversionCreativeSchemaObject = {
  "name": String,
  "image_urls": Array,
  "video_urls": Array,
  "content_text": String,
  "has_button": Boolean,
  "button_list": Array,
  "main_creatives_list": [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PostCreative'
  }]
}

export const conversionCreativeSchemaDescription = {
  "name": "Name of the post creative",
  "image_urls": "List of image URLs.",
  "video_urls": "List of video URLs.",
  "content_text": "Content text",
  "main_creatives_list": "Main Creatives List",
  "has_button": "Has Button",
  "button_list": "List of buttons"
}

const conversionCreativeSchema = mongoose.Schema({
  ...requiredConversionCreativeSchemaObject,
  "sticker": Object,
  "is_edited": {
    type: Boolean, default: false
  },
  "is_edit_approved": {
    type: Boolean, default: false
  },
  "has_phone_number": {
    type: Boolean, default: false
  },
  "phone_number": String,
  "has_visit_us": {
    type: Boolean, default: false
  },
  "visit_us_title": {
    type: String, default: "Visit us 🌍️"
  },
  "website": String,
  "has_like": {
    type: Boolean, default: false
  },
  "has_dislike": {
    type: Boolean, default: false
  },
  "is_active": {
    type: Boolean, default: true
  },
}, {
  timestamps: true,
})

const ConversionCreative = mongoose.model("ConversionCreative", conversionCreativeSchema)
export default ConversionCreative


