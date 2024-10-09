import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import BotLanguages, { requiredBotLanguageRequestBodyDescription, requiredBotLanguageRequestBodyObject } from "../../models/admin/botLanguage.js"
import SupportedLanguages from "../../models/admin/supportedLanguages.js"


// @desc    Get All Bot Languages
// @route   GET /admin/bot_languages
// @access  Private
export const getBotLanguages = asyncHandler(async (req, res) => {
  try {
    const _botLanguages = await BotLanguages.find()
    res.json(_botLanguages)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Add Bot Language
// @route   POST /admin/bot_languages
// @access  Private
export const addBotLanguage = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let requiredKeys = new Set(Object.keys(requiredBotLanguageRequestBodyObject))
    const intersection = checkIntersection(requiredKeys, dataSet)
    if ([...intersection].length === [...requiredKeys].length) {
      const _supportedLanguage = await SupportedLanguages.findOne({ 'short_name': data.short_name })
      if (_supportedLanguage !== null) {
        const _botLanguage = await BotLanguages.findOne({'key': data.key})
        if(_botLanguage === null){
          let shortName = data.short_name
          let values = {}
          values[shortName] =  data.value 
          let tempObj = {
            "key": data.key,
            "values": {...values}
          }
          let newBotLanguage = new BotLanguages(tempObj)
          await newBotLanguage.save()
          res.status(201).json(newBotLanguage)
        }else{
          let shortName = data.short_name
          let values = {..._botLanguage.values}
          values[shortName] = data.value

          _botLanguage.values = values
          await _botLanguage.save()
          res.json(_botLanguage)
        }
      } else {
        logger.error("Invalid language short name.")
        res.status(400).send("Invalid language short name.")
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredBotLanguageRequestBodyObject), dataSet, requiredBotLanguageRequestBodyDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})



