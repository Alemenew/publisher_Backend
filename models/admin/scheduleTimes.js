import mongoose from "mongoose";

export const requiredScheduleTimeSchemaObject = {
  "start_time": String,
  "end_time": String
}

export const requiredScheduleTimeSchemaDescription = {
  "start_time": "Start time",
  "end_time": "End time"
}

const scheduleTimeSchema = mongoose.Schema(
  requiredScheduleTimeSchemaObject, {
  timestamps: true,
})


const ScheduledTime = mongoose.model("ScheduledTime", scheduleTimeSchema)

export default ScheduledTime


