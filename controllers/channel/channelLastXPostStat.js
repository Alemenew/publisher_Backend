import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import Channel, { ChannelLastXNumberOfPostStat, requiredChannelLastXNumberOfPostSchemaDescription, requiredChannelLastXNumberOfPostSchemaObject } from "../../models/channel.js"
import mongoose from "mongoose"
import { fetchChannelLastXPostStats } from "../stat_service.js"


// @desc    Create or Update Channel Last X Post Stat
// @route   POST /channel_stat/create_channel_last_x_post_stat
// @access  Private
export const createChannelLastXPostStat = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredChannelLastXNumberOfPostSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length == [...schemaSet].length) {
      const _channel = await Channel.findOne({ 'id': data.channel_id })
      if (_channel !== null) {
        const _channelLastXPostStats = await ChannelLastXNumberOfPostStat.findOne({ channel_id: _channel._id })

        if (_channelLastXPostStats === null) {
          data.channel_id = _channel._id
          let newChannelLastXPostStat = new ChannelLastXNumberOfPostStat(data)
          await newChannelLastXPostStat.save()
          fetchChannelLastXPostStats(
            _channel.username,
            newChannelLastXPostStat.last_message_id,
            newChannelLastXPostStat.last_post_count,
            newChannelLastXPostStat
          )
          res.status(201).json(newChannelLastXPostStat)
        } else {
          let _id = _channelLastXPostStats._id
          data.channel_id = _channel._id
          const updatedChannelLastXPostStats = await ChannelLastXNumberOfPostStat.findByIdAndUpdate(_id,
            { ...data, _id }, { new: true }
          )

          fetchChannelLastXPostStats(
            _channel.username,
            updatedChannelLastXPostStats.last_message_id,
            updatedChannelLastXPostStats.last_post_count,
            updatedChannelLastXPostStats
          )
          res.json(updatedChannelLastXPostStats)
        }
      } else {
        logger.error("Channel not found.");
        res.status(400).send("Channel not found.")
      }

    }
    else {
      let message = returnErrorMessage(Object.keys(requiredChannelLastXNumberOfPostSchemaObject), dataSet, requiredChannelLastXNumberOfPostSchemaDescription)
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    GET All Channel Last X Post Stat
// @route   GET /channel_stat/get_all_channel_last_x_post_stat
// @access  Private
export const getAllChannelsLastXPostStat = asyncHandler(async (req, res) => {
  try {
    const _channelsLastXPostStats = await ChannelLastXNumberOfPostStat.find()
    res.json(_channelsLastXPostStats)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    GET Channel Last X Post Stat
// @route   GET /channel_stat/get_channel_last_x_post_stat/:channel_id -> ChannelID Mongodb ObjectID
// @access  Private
export const getChannelLastXPostStat = asyncHandler(async (req, res) => {
  try {
    const { id: channel_id } = req.params
    if (channel_id) {
      if (!mongoose.Types.ObjectId.isValid(channel_id)) {
        logger.error("No channel that ID")
        return res.status(404).send('No channel that ID')
      }
      const _channel = await Channel.findById(channel_id)
      if (_channel !== null) {
        const _channelLastXPostStats = await ChannelLastXNumberOfPostStat.findOne({ channel_id: channel_id })
        if (_channelLastXPostStats !== null) {
          res.json(_channelLastXPostStats)
        } else {
          logger.error("No stat fetched for this channel.")
          return res.status(404).send('No stat fetched for this channel.')
        }
      }
    } else {
      logger.error("Channel ID(channel_id) is required.")
      return res.status(404).send('Channel ID(channel_id) is required.')
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
