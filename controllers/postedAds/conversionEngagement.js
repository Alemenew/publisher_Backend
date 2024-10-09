import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import ConversionEngagement, { conversionEngagementSchemaDescription, requiredConversionEngagementSchemaObject } from "../../models/postedAds/conversionEngagement.js";
import { checkIntersection, logStackTrace, prepareBodyForIndividualService, returnErrorMessage } from "../util.js";
import logger from "../../logger/logger.js";
import Channel from "../../models/channel.js";
import PostCreative from "../../models/postCreatives/postCreatives.js";
import Users from "../../models/users.js";
import ConversionCreative from "../../models/postCreatives/conversionCreative.js";
import IndividualBot from "../../models/admin/individualBots.js";
import ConversionBot from "../../models/campaigns/conversionBots.js";

// @desc    Create Conversion Engagement
// @route   POST /posted_ad/conversion_engagement
// @access  Private
export const createConversionEngagement = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredConversionEngagementSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      if (!mongoose.Types.ObjectId.isValid(data.post_creative_id)) {
        logger.error("No post creative with this ID");
        return res.status(400).send("No post creative with this ID")
      }

      const _postCreative = await PostCreative.findById(data.post_creative_id)
      const _fromChannel = await Channel.findOne({ id: data.from_channel_id })

      if (_postCreative !== null && _fromChannel !== null) {

        const _channel = await Channel.findOne({ id: data.channel_id, is_individual: true })
        if (_channel === null) {
          logger.error("No Channel with this ID");
          return res.status(400).send("No Channel with this ID")
        }
        data.channel_id = _channel._id
        data.from_channel_id = _fromChannel._id

        const _conversionEngagement = await ConversionEngagement.findOne({ 'post_creative_id': data.post_creative_id, 'from_channel_id': data.from_channel_id, 'channel_id': data.channel_id })
        if (_conversionEngagement !== null) {
          data.is_duplicate = true
        }

        const newConversionEngagement = new ConversionEngagement(data)
        await newConversionEngagement.save()
        res.json(newConversionEngagement)
      } else {
        let message = `No post creative with ID ${data.posted_creative_id}`
        if (_fromChannel === null) {
          message = `No channel with ID ${data.from_channel_id}`
        }
        logger.error(message);
        return res.status(400).send(message)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredConversionEngagementSchemaObject), dataSet, conversionEngagementSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create Conversion Engagement
// @route   GET /posted_ad/conversion_engagement
// @access  Private
export const getAllConversionEngagement = asyncHandler(async (req, res) => {
  try {
    const conversionEngagement = await ConversionEngagement.find().populate("post_creative_id").populate({
      path: "from_channel_id",
      model: 'Channel',
      select: '_id, title',
    }).populate("channel_id")
    res.json(conversionEngagement)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Send Conversion AD
// @route   POST /posted_ad/create_conversion_post/:id (telegram user id) not _id -> Mongodb objectID
// @access  Private
export const createConversionPost = asyncHandler(async (req, res) => {
  try {
    const { id: user_id } = req.params
    const data = req.body
    let post_creative_id = data.post_creative_id
    let from_channel_id = data.from_channel_id
    if (post_creative_id !== undefined && from_channel_id !== undefined) {
      const _user = await Users.findOne({ 'id': user_id, "type": "individual" }).populate('bot_id')
      if (_user !== null) {
        let _channel = await Channel.findOne({ 'user_id': _user._id, 'is_individual': true })
        let _fromChannel = await Channel.findOne({ 'id': from_channel_id })
        if (_channel !== null && _fromChannel !== null) {
          const _conversionCreatives = await ConversionCreative.find({ 'is_active': true })
          if (_conversionCreatives !== null) {
            let postCreative = null
            for (let conversionCreative of _conversionCreatives) {
              if (conversionCreative.main_creatives_list.includes(post_creative_id)) {
                postCreative = conversionCreative
                break
              }
            }
            if (postCreative !== null) {
              let _bot = _user.bot_id
              if (data.bot_token !== undefined) {
                let currentBot = await IndividualBot.findOne({ 'token': data.bot_token })
                if (currentBot !== null) { _bot = currentBot }
                else {
                  currentBot = await ConversionBot.findOne({ 'token': data.bot_token })
                  if (currentBot !== null) { _bot = currentBot }
                }
              }

              let dataForIndividualBot = prepareBodyForIndividualService(postCreative, _user.id, _bot.token)
              dataForIndividualBot['post_creative_id'] = postCreative._id
              dataForIndividualBot['main_post_creative_id'] = post_creative_id
              dataForIndividualBot['channel_id'] = _channel._id
              dataForIndividualBot['bot_id'] = _bot._id
              dataForIndividualBot['from_channel_id'] = _fromChannel._id

              res.json(dataForIndividualBot)
            } else {
              logger.error("No active ads right now, please comeback later.")
              res.status(400).send("No active ads right now, please comeback later.")
            }
          } else {
            logger.error("No active ads right now, please comeback later.")
            res.status(400).send("No active ads right now, please comeback later.")
          }
        } else {
          let message = "No channel found for this user!"
          if (_fromChannel === null) {
            message = "No from channel found with this ID"
          }
          logger.error(message)
          res.status(400).send(message)
        }
      } else {
        logger.error("User not found with the specified ID")
        res.status(400).send("User not found with the specified ID")
      }
    } else {
      let message = "No post creative ID provided"
      if (from_channel_id === undefined) {
        message = "No from channel ID provided"
      }
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

