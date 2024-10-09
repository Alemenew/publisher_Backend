import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { logStackTrace } from "../util.js"
import Channel from "../../models/channel.js"
import { LAST_POST_COUNT } from "../constants.js"
import { fetchChannelMessageAndSaveStats } from "../stat_service.js"


// @desc    Save Last Message ID and Post Per Day
// @route   POST /channel/save_last_message_id_and_post_per_day/
// @access  Private
export const saveLastMessageIDAndPostPerDay = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let last_message_id = data.last_message_id
    let average_post_per_day = data.average_post_per_day
    let channel_id = data.channel_id
    if (last_message_id !== undefined && average_post_per_day !== undefined && channel_id !== undefined) {
      if (last_message_id > LAST_POST_COUNT) {
        let _channel = await Channel.findOne({ 'id': channel_id })
        if (_channel !== null) {
          _channel.average_post_per_day = average_post_per_day
          await _channel.save()

          let message_id = parseInt(last_message_id) - LAST_POST_COUNT
          let channel_username = _channel.username
          fetchChannelMessageAndSaveStats(_channel._id, channel_username, message_id, last_message_id)
          res.json(_channel)
        } else {
          logger.error("Channel not found.");
          res.status(400).send("Channel not found.")
        }
      } else {
        logger.error(`Last message ID should be greater than ${LAST_POST_COUNT}`);
        res.status(400).send(`Last message ID should be greater than ${LAST_POST_COUNT}`)
      }
    } else {
      let message = "Last message ID(last_message_id) is required."
      if (average_post_per_day === undefined) {
        message = "Average post per day(average_post_per_day) is required."
      }
      else if (channel_id === undefined) {
        message = "Channel ID(channel_id) is required."
      }
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

