import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import SupportedLanguages, { requiredSupportedLanguagesSchemaDescription, requiredSupportedLanguagesSchemaObject } from "../../models/admin/supportedLanguages.js"


// @desc    Get Supported Languages
// @route   GET /admin/supported_languages
// @access  Private
export const getSupportedLanguages = asyncHandler(async (req, res) => {
  try {
    const supportedLanguages = await SupportedLanguages.find()
    res.json(supportedLanguages)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Create Supported Language
// @route   POST /admin/supported_languages
// @access  Private
export const createSupportedLanguage = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredSupportedLanguagesSchemaObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      const _supportedLanguage = await SupportedLanguages.findOne({ $or: [{ 'short_name': data.short_name }, { 'name': data.name }] })
      if (_supportedLanguage === null) {
        let newSupportedLanguage = new SupportedLanguages(data)
        await newSupportedLanguage.save()
        res.status(201).json(newSupportedLanguage)
      } else {
        logger.error('Language already exist.')
        res.status(400).send('Language already exist.')
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredSupportedLanguagesSchemaObject), dataSet, requiredSupportedLanguagesSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Supported Language
// @route   GET /admin/supported_languages/:id Mongodb ObjectID(_id)
// @access  Private
export const getSupportedLanguage = asyncHandler(async (req, res) => {
  try{
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid ID");
      return res.status(404).send("Invalid ID")
    }
    const supportedLanguage = await SupportedLanguages.findById(_id)
    res.json(supportedLanguage)
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update Supported Language
// @route   PATCH /admin/supported_languages/:id Mongodb ObjectID(_id)
// @access  Private
export const updateSupportedLanguage = asyncHandler(async (req, res) => {
  try{
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid ID");
      return res.status(404).send("Invalid ID")
    }
    const updatedLanguage = await SupportedLanguages.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
    res.json(updatedLanguage)
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})