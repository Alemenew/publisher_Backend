import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import ConversionBot, { requiredConversionBotSchemaDescription, requiredConversionBotSchemaObject } from "../../models/campaigns/conversionBots.js";
import Campaign from "../../models/campaigns/campaigns.js";


// @desc    Get All Conversion Bots
// @route   GET /campaign/conversion_bots
// @access  Private
export const getAllConversionBots = asyncHandler(async (req, res) => {
  try {
    const _conversionBots = await ConversionBot.find().sort({ createdAt: -1 })
    res.json(_conversionBots)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Active Conversion Bots
// @route   GET /campaign/active_conversion_bots
// @access  Private
export const getActiveConversionBots = asyncHandler(async (req, res) => {
  try {
    const _conversionBots = await ConversionBot.find({ 'is_active': true }).sort({ createdAt: -1 })
    res.json(_conversionBots)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Create Conversion Bot
// @route   POST /campaign/conversion_bots
// @access  Private
export const createConversionBot = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredConversionBotSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      const _bot = await ConversionBot.findOne({ $or: [{ 'token': data.token }, { 'username': data.username }] })
      if (_bot === null) {
        if (!mongoose.Types.ObjectId.isValid(data.campaign_id)) {
          logger.error("Invalid Campaign ID");
          return res.status(404).send("Invalid Campaign ID")
        }
        const _campaign = await Campaign.findById(data.campaign_id)
        if (_campaign) {
          const newConversionBot = new ConversionBot(data)
          await newConversionBot.save()
          res.status(201).json(newConversionBot)
        }
        else {
          logger.error('Campaign not found.');
          res.status(400).send('Campaign not found.')
        }
      } else {
        console.log(_bot)
        let message = "Bot username already taken."
        if (_bot.token === data.token) {
          message = "Bot token already taken."
        }
        logger.error(message);
        res.status(400).send(message)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredConversionBotSchemaObject), dataSet, requiredConversionBotSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})



// @desc    Update Conversion Bot
// @route   PATCH /campaign/conversion_bots/:id -> Mongodb objectID
// @access  Private
export const updateConversionBot = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid ConversionBot ID");
      return res.status(404).send("Invalid ConversionBot ID")
    }

    let is_campaign_valid = true
    let message = ""

    if (data.campaign_id) {
      if (!mongoose.Types.ObjectId.isValid(data.campaign_id)) {
        message = "Invalid Campaign ID"
        is_campaign_valid = false
      }
      if (is_campaign_valid) {
        const _campaign = await Campaign.findById(data.campaign_id)
        if (_campaign === null) {
          message = "Campaign not found."
          is_campaign_valid = false
        }
      }
    }

    if (is_campaign_valid) {
      const _updatedConversionBot = await ConversionBot.findByIdAndUpdate(_id,
        { ...data, _id }, { new: true }
      )
      if (_updatedConversionBot) {
        res.json(_updatedConversionBot)
      } else {
        logger.error("Bot not found.")
        res.status(400).send("Bot not found.")
      }
    } else {
      logger.error(message)
      res.status(400).send(message)
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

