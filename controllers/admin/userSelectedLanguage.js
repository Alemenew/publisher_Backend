import asyncHandler from "express-async-handler"
import mongoose from "mongoose";
import logger from "../../logger/logger.js";
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js";
import UserSelectedLanguage, { requiredUserSelectedLanguageSchemaDescription, requiredUserSelectedLanguageSchemaObject } from "../../models/admin/userSelectedLanguage.js";
import SupportedLanguages from "../../models/admin/supportedLanguages.js";
import { DEFAULT_ENGLISH_LANGUAGE_SHORT_NAME } from "../constants.js";



// @desc    GET User Selected Language
// @route   GET /admin/user_selected_language/:id
// @access  Private
export const getUserSelectedLanguage = asyncHandler(async (req, res) => {
  try {
    const { id: user_id } = req.params

    const _userSelectedLanguage = await UserSelectedLanguage.findOne({ "user_id": user_id }).populate('selected_language')
    if (_userSelectedLanguage !== null) {
      res.json(_userSelectedLanguage.selected_language)
    } else {
      let _englishLang = await SupportedLanguages.findOne({ "short_name": DEFAULT_ENGLISH_LANGUAGE_SHORT_NAME })
      if (_englishLang !== null) {
        res.json(_englishLang)
      } else {
        logger.error("No language selected for this user!")
        res.status(400).send("No language selected for this user!")
      }
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Save User Selected Language
// @route   POST /admin/user_selected_language/:id
// @access  Private
export const saveUserSelectedLanguage = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredUserSelectedLanguageSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      const _userSelectedLanguage = await UserSelectedLanguage.findOne({ "user_id": data.user_id })
      const _language = await SupportedLanguages.findOne({ "short_name": data.selected_language })
      if (_language !== null) {
        data.selected_language = _language._id
        if (_userSelectedLanguage !== null) {
          _userSelectedLanguage.selected_language = data.selected_language
          await _userSelectedLanguage.save()
          res.json(_userSelectedLanguage)
        } else {
          const newUserSelectedLanguage = new UserSelectedLanguage(data)
          await newUserSelectedLanguage.save()
          res.status(201).json(newUserSelectedLanguage)
        }
      } else {
        logger.error("Language not found!")
        res.status(400).send("Language not found!")
      }
    }
    else {
      let message = returnErrorMessage(Object.keys(requiredUserSelectedLanguageSchemaObject), dataSet, requiredUserSelectedLanguageSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})