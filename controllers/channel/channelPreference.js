import mongoose from "mongoose";
import Channel, { requiredChannelPreferenceSchemaObject as ChannelPreferenceSchemaObject, channelPreferenceSchemaObjectDescription as SchemaDescription, ChannelPreference } from "../../models/channel.js";
import { checkIntersection, getChannelCategoryIDsForContentInterest, logStackTrace, returnErrorMessage } from "../util.js"
import logger from "../../logger/logger.js";
import asyncHandler from "express-async-handler"
import DaySection from "../../models/admin/daySections.js";
import Users from "../../models/users.js";


// @desc    Create individual preference
// @route   POST /channel/individual_preference/:id (telegram user id) not _id -> Mongodb objectID
// @access  Private
export const createIndividualPreference = asyncHandler(async (req, res) => {
  try {
    const { id: user_id } = req.params
    if (user_id !== undefined) {
      const _user = await Users.findOne({ 'id': user_id })
      if (_user !== null) {
        let _channel = await Channel.findOne({ 'user_id': _user._id, 'is_individual': true })
        if (_channel === null) {
          let channelObj = {
            "id": user_id,
            "user_id": _user._id,
            "is_individual": true
          }
          const newChannel = new Channel(channelObj)
          await newChannel.save()
          _channel = newChannel
        }

        if (_channel !== null) {
          let channelPreference = req.body
          let channelPreferenceSet = new Set(Object.keys(channelPreference))
          let schemaSet = new Set(Object.keys(ChannelPreferenceSchemaObject))
          const intersection = checkIntersection(schemaSet, channelPreferenceSet)
          if ([...intersection].length === [...schemaSet].length) {
            const _channelPreference = await ChannelPreference.findOne({ 'channel_id': _channel._id })
            const _postTimes = channelPreference.post_time
            let postTimeIDs = []
            for (let postTime of _postTimes) {
              const _postTime = await DaySection.findOne({ 'day_section_key': postTime })
              if (_postTime !== null) {
                postTimeIDs.push(_postTime._id)
              }
            }
            channelPreference['post_time_ids'] = postTimeIDs
            if (_channelPreference === null) {
              let contentInterest = channelPreference.content_interest
              let ids_list = await getChannelCategoryIDsForContentInterest(contentInterest)
              if (ids_list.length > 0) channelPreference.content_interest_ids = ids_list
              channelPreference['channel_id'] = _channel._id
              const newChannelPreference = new ChannelPreference(channelPreference)
              await newChannelPreference.save()
              res.status(201).json(newChannelPreference)
            } else {
              let contentInterest = channelPreference.content_interest
              let ids_list = await getChannelCategoryIDsForContentInterest(contentInterest)
              if (ids_list.length > 0) channelPreference.content_interest_ids = ids_list
              channelPreference['channel_id'] = _channel._id
              let _id = _channelPreference._id
              const updatedChannelPreference = await ChannelPreference.findByIdAndUpdate(_id,
                { ...channelPreference, _id }, { new: true }
              )
              res.status(200).json(updatedChannelPreference)
            }
          } else {
            let message = returnErrorMessage(Object.keys(ChannelPreferenceSchemaObject), channelPreferenceSet, SchemaDescription)
            logger.error(message)
            res.status(400).send(message)
          }
        } else {
          logger.error("Can not find or save your data.")
          res.status(400).send("Can not find or save your data.")
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


// @desc    Create channel preference
// @route   POST /channel/preference/:id (telegram channel id) not _id -> Mongodb objectID
// @access  Private
export const createChannelPreference = asyncHandler(async (req, res) => {
  try {
    const { id: channel_id } = req.params
    if (channel_id !== undefined) {
      const _channel = await Channel.findOne({ 'id': channel_id })
      if (_channel !== null) {
        let channelPreference = req.body
        let channelPreferenceSet = new Set(Object.keys(channelPreference))
        let schemaSet = new Set(Object.keys(ChannelPreferenceSchemaObject))
        const intersection = checkIntersection(schemaSet, channelPreferenceSet)
        if ([...intersection].length === [...schemaSet].length) {
          const _channelPreference = await ChannelPreference.findOne({ 'channel_id': _channel._id })
          const _postTimes = channelPreference.post_time
          let postTimeIDs = []
          for (let postTime of _postTimes) {
            const _postTime = await DaySection.findOne({ 'day_section_key': postTime })
            if (_postTime !== null) {
              postTimeIDs.push(_postTime._id)
            }
          }
          channelPreference['post_time_ids'] = postTimeIDs
          if (_channelPreference === null) {
            let contentInterest = channelPreference.content_interest
            let ids_list = await getChannelCategoryIDsForContentInterest(contentInterest)
            if (ids_list.length > 0) channelPreference.content_interest_ids = ids_list
            channelPreference['channel_id'] = _channel._id
            const newChannelPreference = new ChannelPreference(channelPreference)
            await newChannelPreference.save()
            res.status(201).json(newChannelPreference)
          } else {
            let contentInterest = channelPreference.content_interest
            let ids_list = await getChannelCategoryIDsForContentInterest(contentInterest)
            if (ids_list.length > 0) channelPreference.content_interest_ids = ids_list
            channelPreference['channel_id'] = _channel._id
            let _id = _channelPreference._id
            const updatedChannelPreference = await ChannelPreference.findByIdAndUpdate(_id,
              { ...channelPreference, _id }, { new: true }
            )
            res.status(200).json(updatedChannelPreference)
          }
        } else {
          let message = returnErrorMessage(Object.keys(ChannelPreferenceSchemaObject), channelPreferenceSet, SchemaDescription)
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

// @desc    Get channel preference
// @route   GET /channel/preference/:id (telegram channel id) not _id -> Mongodb objectID
// @access  Private
export const getChannelPreference = asyncHandler(async (req, res) => {
  try {
    const { id: channel_id } = req.params
    if (channel_id !== undefined) {
      const _channel = await Channel.findOne({ 'id': channel_id })
      if (_channel !== null) {
        const _channelPreference = await ChannelPreference.findOne({ 'channel_id': _channel._id }).populate('post_time_ids').populate('content_interest_ids')
        if (_channelPreference !== null) {
          res.json(_channelPreference)
        } else {
          logger.error("No preference exist under this channel")
          res.status(400).send("No preference exist under this channel")
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