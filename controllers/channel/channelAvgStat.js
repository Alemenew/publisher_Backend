import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import Channel, { ChannelAvgViewStat, channelStatDescription, requiredChannelStatSchemaObject } from "../../models/channel.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"


// @desc    Create Channel Stat
// @route   POST /channel/channel_stat/:id (telegram channel id) not _id -> Mongodb objectID
// @access  Private
export const createChannelStat_ = asyncHandler(async (req, res) => {
  try {
    const { id: channel_id } = req.params
    if (channel_id !== undefined) {
      const _channel = await Channel.findOne({ 'id': channel_id })
      if (_channel !== null) {
        let channelStat = req.body
        const channelStatSet = new Set(Object.keys(channelStat))
        const schemaSet = new Set(Object.keys(requiredChannelStatSchemaObject))
        let intersection = checkIntersection(schemaSet, channelStatSet)
        if ([...intersection].length === [...schemaSet].length) {
          const _channelStat = await ChannelAvgViewStat.findOne({ 'channel_id': _channel._id })
          if (_channelStat === null) {
            channelStat['channel_id'] = _channel._id
            channelStat['7_days_avg_view_count_list'] = [channelStat.last_7_days_avg_view_count]
            channelStat['30_days_avg_view_count_list'] = [channelStat.last_30_days_avg_view_count]
            const newChannelStat = new ChannelAvgViewStat(channelStat)
            await newChannelStat.save()
            res.status(201).json(newChannelStat)
          }
          else {
            let _id = _channelStat._id
            let _7_day_list = _channelStat['7_days_avg_view_count_list']
            let _30_day_list = _channelStat['30_days_avg_view_count_list']
            channelStat['7_days_avg_view_count_list'] = [..._7_day_list, channelStat.last_7_days_avg_view_count]
            channelStat['30_days_avg_view_count_list'] = [..._30_day_list, channelStat.last_30_days_avg_view_count]
            const updatedChannelStat = await ChannelAvgViewStat.findByIdAndUpdate(_id,
              { ...channelStat, _id }, { new: true }
            )
            res.json(updatedChannelStat)
          }
        } else {
          let message = returnErrorMessage(Object.keys(requiredChannelStatSchemaObject), channelStatSet, channelStatDescription)
          logger.error(message)
          res.status(400).send(message)
        }
      } else {
        logger.error("Channel not found with the specified ID")
        res.status(400).send("Channel not found with the specified ID")
      }
    } else {
      logger.error("Channel ID required.")
      res.status(400).send("Channel ID required.")
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create Channel Stat
// @route   POST /channel/channel_stat/:id (telegram channel id) not _id -> Mongodb objectID
// @access  Private
export const createChannelStat = asyncHandler(async (req, res) => {
  try {
    const { id: channel_id } = req.params
    if (channel_id !== undefined) {
      const _channel = await Channel.findOne({ 'id': channel_id })
      if (_channel !== null) {
        let channelStat = req.body
        let is_7_days = channelStat.last_7_days
        let is_30_days = channelStat.last_30_days
        let last_7_days_count = channelStat.last_7_days_avg_view_count
        let last_30_days_count = channelStat.last_30_days_avg_view_count
        if (is_30_days !== undefined || is_7_days !== undefined) {
          let data = {}
          const _channelStat = await ChannelAvgViewStat.findOne({ 'channel_id': _channel._id })
          if (is_7_days === true && last_7_days_count !== undefined) {
            if (_channelStat === null) {
              data['7_days_avg_view_count_list'] = [last_7_days_count]
            } else {
              let _7_day_list = _channelStat['7_days_avg_view_count_list']
              data['7_days_avg_view_count_list'] = [..._7_day_list, last_7_days_count]
            }
            data.last_7_days_avg_view_count = last_7_days_count
          }
          if (is_30_days === true && last_30_days_count) {
            if (_channelStat === null) {
              data['30_days_avg_view_count_list'] = [last_30_days_count]
            } else {
              let _30_day_list = _channelStat['30_days_avg_view_count_list']
              data['30_days_avg_view_count_list'] = [..._30_day_list, last_30_days_count]
            }
            data.last_30_days_avg_view_count = last_30_days_count

          }
          if (!(is_7_days === true && last_7_days_count !== undefined) && !(is_30_days === true && last_30_days_count)) {
            let message = ""
            if (!is_30_days || !is_7_days) {
              message = `Either 'last_7_days' or 'last_30_days' has to be true.`
            }
            else if (last_7_days_count !== undefined) {
              message = `${channelStatDescription['last_30_days_avg_view_count']}(last_30_days_avg_view_count) is required.`
            } else {
              message = `${channelStatDescription['last_7_days_avg_view_count']}(last_7_days_avg_view_count) is required.`
            }
            logger.error(message)
            return res.status(400).send(message)
          }
          if (_channelStat === null) {
            data['channel_id'] = _channel._id
            const newChannelStat = new ChannelAvgViewStat(data)
            await newChannelStat.save()
            res.status(201).json(newChannelStat)
          }
          else {
            let _id = _channelStat._id
            const updatedChannelStat = await ChannelAvgViewStat.findByIdAndUpdate(_id,
              { ...data, _id }, { new: true }
            )
            res.json(updatedChannelStat)
          }

        } else {
          logger.error("Either 'last_7_days' or 'last_30_days' is required.")
          res.status(400).send("Either 'last_7_days' or 'last_30_days' is required.")
        }
      } else {
        logger.error("Channel not found with the specified ID")
        res.status(400).send("Channel not found with the specified ID")
      }
    } else {
      logger.error("Channel ID required.")
      res.status(400).send("Channel ID required.")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get All Channel Stat
// @route   GET /channel/channel_stat (telegram channel id) not _id -> Mongodb objectID
// @access  Private
export const getAllChannelStat = asyncHandler(async (req, res) => {
  try {
    const channelStats = await ChannelAvgViewStat.find()
    res.json(channelStats)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Channel Stat
// @route   GET /channel/channel_stat/:id (telegram channel id) not _id -> Mongodb objectID
// @access  Private
export const getChannelStat = asyncHandler(async (req, res) => {
  try {
    const { id: channel_id } = req.params
    if (channel_id !== undefined) {
      const _channel = await Channel.findOne({ 'id': channel_id })
      if (_channel !== null) {
        const _channelStat = await ChannelAvgViewStat.findOne({ 'channel_id': _channel._id })
        if (_channelStat !== null) {
          res.json(_channelStat)
        } else {
          logger.error("No channel view statistics exist under this channel")
          res.status(400).send("No channel view statistics exist under this channel")
        }
      } else {
        logger.error("Channel not found with the specified ID")
        res.status(400).send("Channel not found with the specified ID")
      }
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})