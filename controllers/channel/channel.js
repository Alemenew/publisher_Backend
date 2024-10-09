import mongoose from "mongoose"
import Channel, { requiredChannelSchemaObject as ChannelSchemaObject, channelSchemaObjectDescription as SchemaDescription } from "../../models/channel.js"
import {
  calculateRecentAverageView,
  checkIntersection,
  logStackTrace,
  prepareReport,
  returnErrorMessage,
  returnExtraObject,
  sendReportToChannel,
  sendToAdMasterService, sendToPublisherManagementService,
  updateChannelRecentAverageView
} from "../util.js"
import Users from "../../models/users.js"
import logger from "../../logger/logger.js"
import asyncHandler from "express-async-handler"
import { ChannelCategory } from "../../models/admin/channelCategory.js"
import ChannelTier from "../../models/admin/channelTiers.js"
import { CAMPAIGN_REPORT_CAPTION, REPORT_HTML_CONTENT } from "../constants.js"
import Campaign from "../../models/campaigns/campaigns.js"
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// @desc    Get Channels
// @route   GET /channel
// @access  Public

// TODO: Make private
export const getChannels = asyncHandler(async (req, res) => {
  try {
    const channels = await Channel.find({ 'is_individual': false }).populate('user_id').sort({ createdAt: -1, created_at: -1 })
    // let _channels = channels.map(obj => ({
    //   ...obj._doc,
    //   ['recent_average_view']: 0
    // }));
    // for (let i = 0; i < channels.length; i++) {
    //   if (channels[i]['recent_average_view'] === undefined || channels[i]['recent_average_view'] === 0) {
    //     let v = await updateChannelRecentAverageView(channels[i])
    //     _channels[i]['recent_average_view'] = v
    //   } else {
    //     _channels[i]['recent_average_view'] = channels[i]['recent_average_view']
    //   }
    //   // let v = await calculateRecentAverageView(channels[i]._id)
    //   // _channels[i]['recent_average_view'] = v
    // }
    // res.status(200).json(_channels)
    res.json(channels)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get Channels
// @route   GET /channel_with_views
// @access  Private
export const getChannelsWithViews = asyncHandler(async (req, res) => {
  try {
    const channels = await Channel.find({ 'is_individual': false }).populate('user_id').sort({ createdAt: -1, created_at: -1 })
    const views = {}
    let _channels = channels.map(obj => ({
      ...obj._doc,
      ['view']: 0
    }));
    for (let i = 0; i < channels.length; i++) {
      let v = await calculateRecentAverageView(channels[i]._id)
      _channels[i]['view'] = v
    }
    // for (const channel of channels) {
    //   views[channel._id] = await calculateRecentAverageView(channel._id)
    // }
    // res.status(200).json({ 'channels': channels, 'views': views })
    res.status(200).json(_channels)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create Channel
// @route   POST /channel
// @access  Private
export const createChannel = asyncHandler(async (req, res) => {
  try {
    const channel = req.body
    const channelSet = new Set(Object.keys(channel))
    const schemaSet = new Set(Object.keys(ChannelSchemaObject))
    const intersection = checkIntersection(schemaSet, channelSet)
    if ([...intersection].length == [...schemaSet].length) {
      const _user = await Users.findOne({ 'id': channel.user_id })
      // console.log(_user)
      if (_user !== null) {
        const _channel = await Channel.findOne({ 'id': channel.id })
        if (_channel === null) {
          channel['extra_info'] = returnExtraObject(schemaSet, channel)
          channel['user_id'] = _user._id
          const _channelCategory = await ChannelCategory.findOne({ 'category_key': channel.category_key })
          if (_channelCategory !== null) {
            channel['channel_category_id'] = _channelCategory._id
            const newChannel = new Channel(channel)
            await newChannel.save()
            res.status(201).json(newChannel)
          }
        }
        else {
          logger.error("Channel already registered")
          res.status(400).send("Channel already registered")
        }
      } else {
        logger.error("User not found with the specified user_id")
        res.status(400).send("User not found with the specified user_id")
      }

    }
    else {
      let message = returnErrorMessage(Object.keys(ChannelSchemaObject), channelSet, SchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update Channel
// @route   PATCH /channel/:_id -> Mongodb objectID(not id (channel ID))
// @access  Private
export const updateChannel = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const channel = req.body

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No channel with this ID");
      return res.status(404).send("No channel with this ID")
    }

    const updatedChannel = await Channel.findByIdAndUpdate(_id, { ...channel, _id }, { new: true })
    res.status(200).json(updatedChannel)

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Channel
// @route   GET /channel/:id (channel_id)(not _id -> Mongodb objectID)
// @access  Private
export const getChannel = asyncHandler(async (req, res) => {
  try {
    const { id: id } = req.params
    const channel = await Channel.findOne({ 'id': id })
    if (channel !== null) {
      res.json(channel)
    } else {
      logger.error("Channel not found")
      res.status(404).send("Channel not found")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Channel
// @route   GET /channel/user_channels/:id (user_id(telegram_id))(not _id -> Mongodb objectID)
// @access  Private
export const getUserChannel = asyncHandler(async (req, res) => {
  try {
    const { id: user_id } = req.params
    const _user = await Users.findOne({ 'id': user_id, type: "channel_owner" })
    if (_user !== null) {
      const channels = await Channel.find({ 'user_id': _user._id, 'is_individual': false })
      console.log(_user._id)
      res.json(channels)
    } else {
      logger.error("User not found")
      res.status(404).send("User not found")
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Individual Channel
// @route   GET /channel/individual_channel/:id (user_id(telegram_id))(not _id -> Mongodb objectID)
// @access  Private
export const getIndividualChannel = asyncHandler(async (req, res) => {
  try {
    const { id: user_id } = req.params
    const _user = await Users.findOne({ 'id': user_id, type: "individual" })
    if (_user !== null) {
      const channels = await Channel.find({ 'user_id': _user._id, 'is_individual': true })
      // console.log(channels)
      res.json(channels)
    } else {
      logger.error("User not found")
      res.status(404).send("User not found")
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Activate User Channel
// @route   POST /channel/user_channels/activate_channel
// @access  Private
export const activateUserChannel = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const channel_id = data.channel_id
    const user_id = data.user_id

    if (channel_id !== undefined && user_id !== undefined) {
      const _user = await Users.findOne({ 'id': user_id })
      if (_user !== null) {
        const channel = await Channel.findOneAndUpdate({ 'user_id': _user._id, id: channel_id }, { 'is_active': true }, { new: true })
        if (channel !== null) {
          res.json(channel)
        } else {
          logger.error("Channel not found")
          res.status(404).send("Channel not found.")
        }
      } else {
        logger.error("User not found")
        res.status(404).send("User not found")
      }
    } else {
      let msg = ""
      if (channel_id !== undefined) {
        msg = "User ID(user_id) is required."
      } else {
        msg = "Channel ID(channel_id) is required."
      }
      logger.error(msg)
      res.status(400).send(msg)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Deactivate User Channel
// @route   POST /channel/user_channels/deactivate_channel
// @access  Private
export const deactivateUserChannel = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const channel_id = data.channel_id
    const user_id = data.user_id

    if (channel_id !== undefined && user_id !== undefined) {
      const _user = await Users.findOne({ 'id': user_id })
      if (_user !== null) {
        const channel = await Channel.findOneAndUpdate({ 'user_id': _user._id, id: channel_id }, { 'is_active': false }, { new: true })
        if (channel !== null) {
          res.json(channel)
        } else {
          logger.error("Channel not found")
          res.status(404).send("Channel not found.")
        }
      } else {
        logger.error("User not found")
        res.status(404).send("User not found")
      }
    } else {
      let msg = ""
      if (channel_id !== undefined) {
        msg = "User ID(user_id) is required."
      } else {
        msg = "Channel ID(channel_id) is required."
      }
      logger.error(msg)
      res.status(400).send(msg)
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update Channel Tier KPI Value
// @route   POST /channel/update_channel_tier_kpi_value/:id  (_id -> Mongodb objectID)
// @access  Private
export const UpdateChannelTierKPIValue = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    let data = req.body
    if (data.name !== undefined && data.value !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("Invalid channel ID")
        return res.status(404).send('Invalid channel ID')
      }
      let _channel = await Channel.findById(_id)
      if (_channel !== null) {
        let _channelTier = await ChannelTier.findOne({ 'name': _channel.channel_tier })
        if (_channelTier !== null) {
          let _kpi = _channelTier.KPI
          let _kpiIndex = _kpi.findIndex((obj => obj.name === data.name))

          let channel_tier_values = [..._channel.channel_tier_values]
          let _channelTierValueIndex = channel_tier_values.findIndex((obj => obj.name === data.name))

          if (_kpiIndex !== -1 && _channelTierValueIndex !== -1) {
            let items = []
            for (let tier_value of _channel.channel_tier_values) {
              if (tier_value.name === data.name) {
                items.push({
                  "name": tier_value.name,
                  "value": data.value
                })
              } else {
                items.push({
                  "name": tier_value.name,
                  "value": tier_value.value
                })
              }
            }
            // channel_tier_values[_channelTierValueIndex].value = data.value
            _channel.channel_tier_values = [...items]
            await _channel.save()
            res.json(_channel)
          } else {
            logger.error("KPI not found")
            res.status(404).send("KPI not found")
          }
        } else {
          logger.error("Channel tier not found")
          res.status(404).send("Channel tier not found")
        }
      } else {
        logger.error("Channel not found")
        res.status(404).send("Channel not found")
      }
    } else {
      let msg = "Name(name) is required."
      if (data.name !== undefined) {
        msg = "Value(value) is required."
      }
      logger.error(msg)
      res.status(400).send(msg)
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Add Tier to Channel
// @route   POST /channel/add_tier/:id  (_id -> Mongodb objectID)
// @access  Private
export const addTierToChannel = asyncHandler(async (req, res) => {
  try {
    let data = req.body
    const { id: _id } = req.params

    if (data.name !== undefined) {
      let _channelTier = await ChannelTier.findOne({ 'name': data.name })
      if (_channelTier !== null) {
        let _channel = await Channel.findById(_id)
        if (_channel !== null) {
          if (_channel.channel_tier !== undefined) {
            if (_channel.channel_tier !== _channelTier.name) {
              _channel.channel_tier_values = []
            }
          }
          _channel.channel_tier = _channelTier.name
          let values = []
          for (let i = 0; i < _channelTier.KPI.length; i++) {
            values.push({
              "name": _channelTier.KPI[i].name,
              "value": _channelTier.KPI[i].value
            })
          }
          _channel.channel_tier_values = [...values]

          await _channel.save()
          res.json(_channel)
        } else {
          logger.error("Channel not found")
          res.status(404).send("Channel not found")
        }
      } else {
        logger.error("Channel tier not found")
        res.status(404).send("Channel tier not found")
      }
    } else {
      let message = "Tier name(name) is required."
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Check if Admin Right Revoked
// @route   GET /channel/check_admin_right/:id  (_id -> Mongodb objectID)
// @access  Private
export const checkAdminRight = asyncHandler(async (req, res) => {
  try{
    const { id: _id } = req.params
    let data = req.body
    let notify = data.notify ?? false
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid channel ID")
      return res.status(404).send('Invalid channel ID')
    }
    let _channel = await Channel.findById(_id).populate('user_id')
    if (_channel !== null) {
      let checkIsAdminReqBody = {
        "channels": [{
          "id": _channel._id.toString(),
          "channel_id": _channel.id
        }]
      }
      let response = await sendToAdMasterService(checkIsAdminReqBody, "check_right")
      if (response[1].length > 0) {
        if(notify){
        let notifyChannelOwnersRequestBody = {
          "text": "<b>Your channel: CHANNEL_HANDLE </b> has been <b>DEACTIVATED! 🚫🚫🚫🚫</b>\n\nWe detected that you have revoked admin rights from our bot for your channel: CHANNEL_HANDLE .\n\nPlease add https://t.me/AiqemAdsMasterBot as an admin on your channel and click verify.\n The bot needs admin access to post ads on your channel.",
          "channels": [
            {
              "id": _channel._id.toString(),
              "user_id": _channel.user_id.id.toString(),
              "channel_handle": _channel.channel_handle,
              "channel_id": _channel.id
            }
          ]
        }
        const notifyChannelResponse = await sendToPublisherManagementService(notifyChannelOwnersRequestBody, 'notify_admin_right_revoked')
      }
        _channel.is_active = false
        await _channel.save()
        let message = notify ? "Admin right revoked, Channel owner notified." :"Admin right revoked, Channel has been deactivated."
        res.status(400).send(message)

      }
      else{
        res.status(200).send("Admin right not revoked.")
      }
    }else {
      logger.error("Channel not found")
      res.status(404).send("Channel not found")
    }
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Add Tier to Channel
// @route   POST /channel/download_campaign_report/:id  (_id -> Mongodb objectID)
// @access  Private
export const downloadCampaignReport = asyncHandler(async (req, res) => {
  try {
    let data = req.body
    const { id: _id } = req.params
    if (data.campaign_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("Invalid channel ID")
        return res.status(404).send('Invalid channel ID')
      }
      if (!mongoose.Types.ObjectId.isValid(data.campaign_id)) {
        logger.error("Invalid campaign ID")
        return res.status(404).send('Invalid campaign ID')
      }
      let _channel = await Channel.findById(_id)
      let _campaign = await Campaign.findById(data.campaign_id)
      if (_channel && _campaign) {
        let pdf = await prepareReport(data.campaign_id, _id)

        res.setHeader('Content-Disposition', 'attachment; filename=example.pdf');
        res.setHeader('Content-Type', 'application/pdf');

        res.send(pdf)
      } else {
        let message = "Channel not found."
        logger.error(message)
        res.status(400).send(message)
      }

    } else {
      let message = "Campaign ID(campaign_id) is required."
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Add Tier to Channel
// @route   POST /channel/send_campaign_report_to_channel/:id  (_id -> Mongodb objectID)
// @access  Private
export const sendCampaignReportToChannel = asyncHandler(async (req, res) => {
  try {
    let data = req.body
    const { id: _id } = req.params
    if (data.campaign_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("Invalid channel ID")
        return res.status(404).send('Invalid channel ID')
      }
      if (!mongoose.Types.ObjectId.isValid(data.campaign_id)) {
        logger.error("Invalid campaign ID")
        return res.status(404).send('Invalid campaign ID')
      }
      let _channel = await Channel.findById(_id).populate('user_id')
      let _campaign = await Campaign.findById(data.campaign_id)
      if (_channel && _campaign) {
        let pdf = await prepareReport(data.campaign_id, _id)
        let caption = CAMPAIGN_REPORT_CAPTION.replace('CAMPAIGN', _campaign.name)
        await sendReportToChannel(_channel.user_id.id, pdf, `${_channel.title}-${_campaign.name}.pdf`, caption)
        res.send("Report sent to channel")
      } else {
        let message = "Channel not found."
        logger.error(message)
        res.status(400).send(message)
      }

    } else {
      let message = "Campaign ID(campaign_id) is required."
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})