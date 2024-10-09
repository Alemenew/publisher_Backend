import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import IndividualBot, { requiredIndividualBotsSchemaDescription, requiredIndividualBotsSchemaObject } from "../../models/admin/individualBots.js"




// @desc    Get All Individual Bots
// @route   GET /admin/individual_bots
// @access  Private
export const getAllIndividualBots = asyncHandler(async (req, res) => {
  try {
    const _individualBots = await IndividualBot.find()
    res.json(_individualBots)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })

  }
})

// @desc    Get All Test Individual Bots
// @route   GET /admin/test_individual_bots
// @access  Private
export const getAllTestIndividualBots = asyncHandler(async (req, res) => {
  try {
    const _individualBots = await IndividualBot.find({ 'type': 'test' })
    res.json(_individualBots)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })

  }
})

// @desc    Get All Production Individual Bots
// @route   GET /admin/prod_individual_bots
// @access  Private
export const getAllProdIndividualBots = asyncHandler(async (req, res) => {
  try {
    const _individualBots = await IndividualBot.find({ 'type': 'prod' })
    res.json(_individualBots)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })

  }
})



// @desc    Create Individual Bot
// @route   POST /admin/individual_bots
// @access  Private
export const createIndividualBot = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredIndividualBotsSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      const _bot = await IndividualBot.findOne({ $or: [{ 'token': data.token }, { 'username': data.username }] })
      if (_bot === null) {
        const newBot = new IndividualBot(data)
        await newBot.save()
        res.status(201).json(newBot)
      } else {
        let message = ""
        if (_bot.token === data.token) {
          message = "Bot token already taken."
        } else {
          message = "Bot username already taken."
        }
        logger.error(message);
        res.status(400).send(message)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredIndividualBotsSchemaObject), dataSet, requiredIndividualBotsSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })

  }
})

// @desc    Update Individual Bot
// @route   PATCH /admin/individual_bots/:id -> Mongodb objectID
// @access  Private
export const updateIndividualBot = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (_id !== undefined) {
      const updatedBot = await IndividualBot.findByIdAndUpdate(_id,
        { ...data, _id }, { new: true }
      )
      if (updatedBot) {
        res.json(updatedBot)
      } else {
        logger.error("Bot not found.")
        res.status(400).send("Bot not found.")
      }
    } else {
      logger.error("Bot ID is required")
      res.status(400).send("Bot ID is required")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })

  }
})
