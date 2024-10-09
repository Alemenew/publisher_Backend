import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js";
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js";
import DaySection, { daySectionSchemaDescription, requiredDaySectionSchemaObject } from "../../models/admin/daySections.js";


// @desc    Create Day-Section
// @route   POST /admin/day_sections
// @access  Private
export const createDaySection = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredDaySectionSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length == [...schemaSet].length) {
      const _daySection = await DaySection.findOne({ 'day_section_key': data.day_section_key })
      if (_daySection === null) {
        const newDaySection = new DaySection(data)
        await newDaySection.save()
        res.status(201).json(newDaySection)
      } else {
        logger.error("day-section already exist")
        res.status(400).send("day-section already exist")
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredDaySectionSchemaObject), dataSet, daySectionSchemaDescription)
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get Day-Sections
// @route   GET /admin/day-sections
// @access  Private
export const getDaySections = asyncHandler(async (req, res) => {
  try {
    const daySections = await DaySection.find()
    res.json(daySections)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get Day-Section
// @route   GET /admin/day-sections/:id
// @access  Private
export const getDaySection = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No day-section registered with that ID")
      return res.status(404).send('No day-section registered with that ID')
    }
    const daySection = await DaySection.findById(_id)
    res.json(daySection)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

