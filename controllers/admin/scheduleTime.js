import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import ScheduledTime, { requiredScheduleTimeSchemaObject } from "../../models/admin/scheduleTimes.js"

// @desc    Get All Schedule Times
// @route   GET /admin/schedule_times
// @access  Private
export const getAllScheduleTimes = asyncHandler(async (req, res) => {
  try{
    const scheduledTimes = ScheduledTime.find()
    res.json(scheduledTimes)
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create Schedule Time
// @route   POST /admin/schedule_times
// @access  Private
export const createScheduleTimes = asyncHandler(async (req, res) => {
  try{
    let data = req.body
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredScheduleTimeSchemaObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      
    }else {
      let message = returnErrorMessage(Object.keys(requiredPostedAdSchemaObject), dataSet, postedAdSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
