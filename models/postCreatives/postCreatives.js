import mongoose from "mongoose";

export const requiredPostCreativeSchemaObject = {
  "name": String,
  "image_urls": Array,
  "video_urls": Array,
  "content_text": String,
  "has_button": Boolean,
  "button_list": Array,
  "campaign_id": {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  }
}

export const postCreativeSchemaDescription = {
  "name": "Name of the post creative",
  "image_urls": "List of image URLs.",
  "video_urls": "List of video URLs.",
  "content_text": "Content text",
  "campaign_id": "Campaign ID",
  "has_button": "Has Button",
  "button_list": "List of buttons"
}

const postCreativeSchema = mongoose.Schema({
  ...requiredPostCreativeSchemaObject,
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
  "is_active": {
    type: Boolean, default: true
  },
  "has_conversion": {
    type: Boolean, default: false
  },
  "conversion_title": {
    type: String, default: "NULL"
  },
  "conversion_bot_username": {
    type: String, default: ""
  },
  "has_see_more": {
    type: Boolean, default: true
  },
}, {
  timestamps: true,
})

const PostCreative = mongoose.model("PostCreative", postCreativeSchema)
export default PostCreative


