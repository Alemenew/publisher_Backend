import mongoose from "mongoose";

/**
 * Day Sections
 */

export const requiredDaySectionSchemaObject = {
  "day_section_key": String,
  "day_section_value": String,
  "start_time": String,
  "end_time": String
}

export const daySectionSchemaDescription = {
  "day_section_key": "Day section key",
  "day_section_value": "Day section value",
  "start_time": "Day section start time",
  "end_time": "Day section end time"
}


const daySectionSchema = mongoose.Schema(
  requiredDaySectionSchemaObject,
  {
    timestamps: true,
  }
)
const DaySection = mongoose.model('DaySection', daySectionSchema)
export default DaySection




