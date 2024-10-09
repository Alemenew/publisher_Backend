import asyncHandler from "express-async-handler"
import mongoose from "mongoose";
import logger from "../../logger/logger.js";
import { addReactionToIndividualPost, checkIntersection, createOrGetAccount, createOrGetPostedAdForIndividual, getCampaignCreatives, getCampaignListForIndividuals, getCreativeToBePostedForIndividual, logStackTrace, prepareBodyForIndividualService, returnErrorMessage, sendToIndividualService } from "../util.js";
import Users from "../../models/users.js";
import Channel, { ChannelPreference } from "../../models/channel.js";
import PostedAdForIndividual, { postedAdForIndividualSchemaDescription, requiredPostedAdForIndividualSchemaObject } from "../../models/postedAds/postedAdForIndividual.js";
import IndividualBot from "../../models/admin/individualBots.js";


// @desc    Save PostedAd for Individual
// @route   POST /individual/save_posted_ad_for_individual
// @access  Private
export const savePostedAdForIndividual = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredPostedAdForIndividualSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      let _postedAdForIndividual = await PostedAdForIndividual.findOne({
        message_id: data.message_id,
        channel_id: data.channel_id,
        post_creative_id: data.post_creative_id
      })
      if (_postedAdForIndividual === null) {
        let newPostedAdForIndividual = new PostedAdForIndividual(data)
        await newPostedAdForIndividual.save()
        res.status(201).json(newPostedAdForIndividual)
      } else {
        logger.error("Advertisement already posted for this individual.")
        res.status(400).send("Advertisement already posted for this individual.")
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredPostedAdForIndividualSchemaObject), dataSet, postedAdForIndividualSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Create individual posts
// @route   POST /individual/individual_post/:id (telegram user id) not _id -> Mongodb objectID
// @access  Private
export const createIndividualPost = asyncHandler(async (req, res) => {
  try {
    // console.log("POSTING")
    const { id: user_id } = req.params
    const data = req.body
    if (user_id !== undefined) {
      const _user = await Users.findOne({ 'id': user_id, "type": "individual" }).populate('bot_id')
      if (_user !== null) {
        let _channel = await Channel.findOne({ 'user_id': _user._id, 'is_individual': true })
        if (_channel !== null) {
          if (_channel.is_active) {
            const _channelPreference = await ChannelPreference.findOne({ 'channel_id': _channel._id })
            const campaigns = await getCampaignListForIndividuals(_channelPreference)

            const campaignsCreatives = await getCampaignCreatives(campaigns)
            let creativeToBePosted = await getCreativeToBePostedForIndividual(campaignsCreatives, _channel)
            if (creativeToBePosted !== null) {
              let _bot = _user.bot_id
              if (data.bot_token !== undefined) {
                let currentBot = await IndividualBot.findOne({ 'token': data.bot_token })
                if (currentBot !== null) { _bot = currentBot }
              }
              let dataForIndividualBot = prepareBodyForIndividualService(creativeToBePosted, _user.id, _bot.token)
              dataForIndividualBot['post_creative_id'] = creativeToBePosted._id
              dataForIndividualBot['channel_id'] = _channel._id
              dataForIndividualBot['bot_id'] = _bot._id

              res.json(dataForIndividualBot)
              // let response = await sendToIndividualService(dataForIndividualBot)
              // if (response[1] !== null) {
              //   if (response[1].success) {
              //     let obj = {
              //       "post_creative_id": creativeToBePosted._id,
              //       "message_id": response[1].message_id,
              //       "channel_id": _channel._id,
              //       "bot_id": _bot._id
              //     }
              //     const newIndividualPost = new PostedAdForIndividual(obj)
              //     await newIndividualPost.save()
              //     res.json(response[1])
              //   }
              //   else {
              //     logger.error(response[1].error)
              //     // res.json(dataForIndividualBot)
              //     res.status(400).send("Error occurred, please come back later.")
              //   }
              // } else {
              //   logger.error(response[0])
              //   // res.json(dataForIndividualBot)
              //   res.status(400).send("Error occurred, please come back later.")
              // }
            } else {
              logger.error("No more ads for you today, please come back later.")
              res.status(400).send("No more ads for you today, please come back later.")
            }
          } else {
            logger.error("Your account has been banned, please contact us for more information.")
            res.status(400).send("Your account has been banned, please contact us for more information.")
          }
        } else {
          logger.error("No channel found for this user!")
          res.status(400).send("No channel found for this user!")
        }
      } else {
        logger.error("User not found with the specified ID")
        res.status(400).send("User not found with the specified ID")
      }
    } else {
      logger.error("User ID is required")
      res.status(400).send("User ID is required")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })

  }
})

// @desc    Create Individual Posts For WebAdView
// @route   POST /individual/individual_post_for_web/:id (telegram user id) not _id -> Mongodb objectID
// @access  Private
export const createIndividualPostForWeb = asyncHandler(async (req, res) => {
  try {
    const { id: user_id } = req.params
    const data = req.body
    const _user = await Users.findOne({ 'id': user_id, "type": "individual" }).populate('bot_id')
    if (_user !== null) {
      let _channel = await Channel.findOne({ 'user_id': _user._id, 'is_individual': true })
      if (_channel !== null) {
        const _channelPreference = await ChannelPreference.findOne({ 'channel_id': _channel._id })
        const campaigns = await getCampaignListForIndividuals(_channelPreference)

        let _bot = _user.bot_id
        if (data.bot_token !== undefined) {
          let currentBot = await IndividualBot.findOne({ 'token': data.bot_token })
          if (currentBot !== null) { _bot = currentBot }
        }

        const campaignsCreatives = await getCampaignCreatives(campaigns)
        let postCreativeDataList = []
        let creativesIdsList = []
        for (let j = 0; j < 3; j++) {
          let creativeToBePosted = await getCreativeToBePostedForIndividual(campaignsCreatives, _channel, creativesIdsList, true)
          if (creativeToBePosted !== null) {
            let postCreativeData = prepareBodyForIndividualService(creativeToBePosted, _user.id, _bot.token)

            postCreativeData['post_creative_id'] = creativeToBePosted._id
            postCreativeData['channel_id'] = _channel._id
            postCreativeData['bot_id'] = _bot._id

            postCreativeDataList.push(postCreativeData)
            creativesIdsList.push(creativeToBePosted._id)
          }
        }
        res.json(postCreativeDataList)
      } else {
        logger.error("No channel found for this user!")
        res.status(400).send("No channel found for this user!")
      }
    } else {
      logger.error("User not found with the specified ID")
      res.status(400).send("User not found with the specified ID")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })

  }
})

// @desc    Save PostedAd for Individual Web
// @route   POST /individual/save_posted_ad_for_individual_web
// @access  Private
export const savePostedAdForIndividualWeb = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredPostedAdForIndividualSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      let _postedAdForIndividual = await createOrGetPostedAdForIndividual(data)
      if (_postedAdForIndividual !== null) {
        if (data.reaction !== undefined) {
          await addReactionToIndividualPost(_postedAdForIndividual, data.reaction)
        }
        res.json(_postedAdForIndividual)
      } else {
        logger.error("Something went wrong, please try again.")
        res.status(400).send("Something went wrong, please try again.")
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredPostedAdForIndividualSchemaObject), dataSet, postedAdForIndividualSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })

  }
})

