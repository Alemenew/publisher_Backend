import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js";
import { calculateTotalCampaignIndividualView, calculateTotalCampaignView, checkIntersection, get_campaign_report, logStackTrace, manualFetchPostedAdStats, returnErrorMessage, sendToAdMasterService, validateBodyForCampaign, validateIDs, validateStartAndEndDate } from "../util.js";
import Campaign, { campaignSchemaDescription, requiredCampaignSchemaObject } from "../../models/campaigns/campaigns.js";
import Company from "../../models/company/company.js";
import { ChannelCategory } from "../../models/admin/channelCategory.js";
import DaySection from "../../models/admin/daySections.js";
import Channel, { ChannelPreference } from "../../models/channel.js";
import moment from "moment";
import PostCreative from "../../models/postCreatives/postCreatives.js";
import PostedAd from "../../models/postedAds/postedAds.js";
import PostedAdStats from "../../models/postedAds/postedAdStats.js";
import StagedPostCreative from "../../models/postCreatives/stagedPostCreatives.js";
import ConversionCreative from "../../models/postCreatives/conversionCreative.js";
import ConversionEngagement from "../../models/postedAds/conversionEngagement.js";
import ConversionBot from "../../models/campaigns/conversionBots.js";


// @desc    Create Campaign
// @route   POST /campaign
// @access  Private
export const createCampaign = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredCampaignSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length == [...schemaSet].length) {
      let isBodyValid = await validateBodyForCampaign(data, null)
      if (isBodyValid === null) {
        data.status = "active"
        data.channel_categories_list = Array.from(new Set(data.channel_categories_list))
        data.day_sections_list = Array.from(new Set(data.day_sections_list))
        let start_date = data.campaign_start_date
        let end_date = data.campaign_end_date

        data.campaign_start_date = new Date(`${start_date} GMT`)
        data.campaign_end_date = new Date(`${end_date} GMT`)

        // let doo = new Date(start_date);
        // console.log(new Date(doo.getTime() - doo.getTimezoneOffset() * -60000));
        // console.log(doo.getTimezoneOffset())

        // data.start_date = new Date(doo.getTime() - doo.getTimezoneOffset() * 30000)
        // data.end_date = moment(end_date)

        const newCampaign = new Campaign(data)
        await newCampaign.save()
        res.status(201).json(newCampaign)
        // res.json(data)
      } else {
        logger.error(isBodyValid);
        res.status(400).send(isBodyValid)
      }
      // if (!mongoose.Types.ObjectId.isValid(data.company_id)) {
      //   logger.error(`No company found under the ID ${data.company_id}`);
      //   return res.status(400).send(`No company found under the ID ${data.company_id}`)
      // }
      // const _company = await Company.findOne({ '_id': data.company_id })
      // if (_company !== null) {
      //   let list_of_channel_categories = await validateIDs(ChannelCategory, data.channel_categories_list)
      //   let list_of_day_sections = await validateIDs(DaySection, data.day_sections_list)
      //   if (list_of_channel_categories[0] !== null && list_of_day_sections[0] !== null) {
      //     data.campaign_start_date = new Date(data.campaign_start_date)
      //     data.campaign_end_date = new Date(data.campaign_end_date)
      //     let isDatesValid = data.campaign_start_date < data.campaign_end_date
      //     if (isDatesValid) {
      //       // const newCampaign = new Campaign(data)
      //       // await newCampaign.save()
      //       // res.status(201).json(newCampaign)
      //       data.status = "active"
      //       res.json(data)
      //     }
      //     else {
      //       logger.error(`end_date(${data.campaign_end_date}) should be after start_date(${data.campaign_start_date})`);
      //       res.status(400).send(`end_date(${data.campaign_end_date}) should be after start_date(${data.campaign_start_date})`)
      //     }
      //   } else {
      //     let message = ""
      //     if (list_of_channel_categories[0] !== null) {
      //       message = `No day section under the ID '${list_of_day_sections[1]}'`
      //     } else {
      //       message = `No channel category under the ID '${list_of_channel_categories[1]}'`
      //     }
      //     logger.error(message);
      //     res.status(400).send(message)
      //   }
      // } else {
      //   logger.error(`No company found under the ID ${data.company_id}`);
      //   res.status(400).send(`No company found under the ID ${data.company_id}`)
      // }
    } else {
      let message = returnErrorMessage(Object.keys(requiredCampaignSchemaObject), dataSet, campaignSchemaDescription)
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Update Campaign
// @route   PATCH /campaign/:id -> mongodb ObjectID
// @access  Private
export const updateCampaign = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No campaign with this ID");
      return res.status(404).send("No campaign with this ID")
    }
    let _campaign = await Campaign.findById(_id)
    if (_campaign !== null) {
      let isBodyValid = await validateBodyForCampaign(data, _campaign._id)
      if (isBodyValid === null) {
        if (data.channel_categories_list !== undefined) {
          data.channel_categories_list = Array.from(new Set(data.channel_categories_list))
        }
        if (data.day_sections_list !== undefined) {
          data.day_sections_list = Array.from(new Set(data.day_sections_list))
        }
        const updatedCampaign = await Campaign.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
        res.json(updatedCampaign)
      } else {
        logger.error(isBodyValid);
        res.status(400).send(isBodyValid)
      }
    }
    else {
      logger.error(`No campaign found under ID '${_id}'`);
      res.status(400).send(`No campaign found under ID '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get All Campaigns
// @route   GET /campaign
// @access  Private
export const getAllCampaigns = asyncHandler(async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).populate('company_id').populate('channel_categories_list')
    res.json(campaigns)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get All Company Campaigns
// @route   GET /campaign/company_campaigns/:id companyID ->mongodb ObjectID
// @access  Private
export const getCompanyCampaigns = asyncHandler(async (req, res) => {
  try {
    const { id: company_id } = req.params
    if (company_id) {
      if (!mongoose.Types.ObjectId.isValid(company_id)) {
        logger.error("No company with that ID")
        return res.status(404).send('No company with that ID')
      }
      const company_campaigns = await Campaign.find({ 'company_id': company_id }).populate('company_id')
      res.json(company_campaigns)
    }
    else {
      logger.error("companyID(company_id) is required.")
      return res.status(404).send('companyID(company_id) is required.')
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get All Compatible Channels for a campaign
// @route   GET /campaign/compatible_channels/:id ->campaign_id Mongodb ObjectID
// @access  Private
export const getAllCompatibleChannels = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("No Campaign with this ID");
        return res.status(400).send("No Campaign with this ID")
      }
      const _campaign = await Campaign.findById(_id)
      if (_campaign !== null) {
        let _campaignCategoryList = _campaign.channel_categories_list
        let _campaignDaySectionList = _campaign.day_sections_list
        let listOfCompatibleChannels = []
        const _channels = await Channel.find({
          "is_active": true,
          "is_individual": false
        }).populate('channel_category_id')
        for (let channel of _channels) {
          let channelPreference = await ChannelPreference.findOne({ 'channel_id': channel._id })
          if (channelPreference !== null) {
            let daySections = channelPreference.post_time_ids
            let contentInterestIds = channelPreference.content_interest_ids

            // console.log(`CAMPAIGN CATEGORY LIST ${_campaignCategoryList.length}`)
            // console.log(`CHANNEL CONTENT INTEREST ${contentInterestIds.length}`)
            const categoryDifference = _campaignCategoryList.filter(item => !contentInterestIds.includes(item.toString()))

            // console.log(`CATEGORY DIFFERENCE ${categoryDifference.length}`)

            const difference = _campaignDaySectionList.filter(item => !daySections.includes(item));
            // console.log(`CAMPAIGN DAY SECTION LIST ${_campaignDaySectionList.length}`)
            // console.log(`PREFERENCE DAY SECTION LIST ${daySections.length}`)
            // console.log(`DIFFERENCE ${difference.length}`)
            if (difference.length < _campaignDaySectionList.length) {
              if (contentInterestIds.length > 0) {
                if (categoryDifference.length < _campaignCategoryList.length) {
                  listOfCompatibleChannels.push(channel)
                }
              }
            }
          }
        }
        res.json(listOfCompatibleChannels)
      } else {
        logger.error(`No campaign for the ID: '${_id}'`)
        res.status(400).send(`No campaign for the ID: '${_id}'`)
      }
    } else {
      logger.error("Campaign ID is required")
      res.status(400).send("Campaign ID is required")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Campaign Detail
// @route   GET /campaign/:id ->Mongodb Object ID
// @access  Private
export const getCampaignDetail = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Campaign with this ID");
      return res.status(400).send("No Campaign with this ID")
    }

    const _campaign = await Campaign.findById(_id).populate('company_id').populate('channel_categories_list').populate('campaign_goal_list').populate('day_sections_list')
    if (_campaign !== null) {
      let totalCampaignView = await calculateTotalCampaignView(_campaign._id)
      let totalCampaignIndividualView = await calculateTotalCampaignIndividualView(_campaign._id)
      res.json({
        "campaign": _campaign,
        "total_view": totalCampaignView,
        "total_individual_view": totalCampaignIndividualView
      })
    } else {
      logger.error(`No campaign for the ID: '${_id}'`)
      res.status(400).send(`No campaign for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Campaign Creatives
// @route   GET /campaign/campaign_creatives/:id ->Mongodb Object ID (Campaign._id)
// @access  Private
export const getCampaignCreatives = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Campaign with this ID");
      return res.status(400).send("No Campaign with this ID")
    }
    const _campaign = await Campaign.findById(_id).populate('company_id').populate('channel_categories_list').populate('campaign_goal_list').populate('day_sections_list')
    if (_campaign !== null) {
      let _campaignCreatives = await PostCreative.find({ 'campaign_id': _campaign._id }).sort({ createdAt: -1 })
      res.json(_campaignCreatives)
    } else {
      logger.error(`No campaign for the ID: '${_id}'`)
      res.status(400).send(`No campaign for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Campaign Channel View Report
// @route   GET /campaign/campaign_channel_view_report/:id ->Mongodb Object ID (Campaign._id)
// @access  Private
export const getCampaignChannelViewReport = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Campaign with this ID");
      return res.status(400).send("No Campaign with this ID")
    }
    const _campaign = await Campaign.findById(_id).populate('company_id')
    if (_campaign !== null) {
      let pdf = await get_campaign_report(_campaign)

      res.setHeader('Content-Disposition', 'attachment; filename=example.pdf');
      res.setHeader('Content-Type', 'application/pdf');

      res.send(pdf)
    } else {
      logger.error(`No campaign for the ID: '${_id}'`)
      res.status(400).send(`No campaign for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Campaign Conversion Bot
// @route   GET /campaign/campaign_conversion_bot/:id ->Mongodb Object ID (Campaign._id)
// @access  Private
export const getCampaignConversionBot = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Campaign with this ID");
      return res.status(400).send("No Campaign with this ID")
    }
    const _campaign = await Campaign.findById(_id).populate('company_id').populate('channel_categories_list').populate('campaign_goal_list').populate('day_sections_list')
    if (_campaign !== null) {
      const _conversionBots = await ConversionBot.find({ 'campaign_id': _campaign._id }).sort({ createdAt: -1 })
      res.json(_conversionBots)
    } else {
      logger.error(`No campaign for the ID: '${_id}'`)
      res.status(400).send(`No campaign for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Campaign Conversion Creatives
// @route   GET /campaign/campaign_conversion_creatives/:id ->Mongodb Object ID (Campaign._id)
// @access  Private
export const getCampaignConversionCreatives = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Campaign with this ID");
      return res.status(400).send("No Campaign with this ID")
    }
    const _campaign = await Campaign.findById(_id).populate('company_id').populate('channel_categories_list').populate('campaign_goal_list').populate('day_sections_list')
    if (_campaign !== null) {
      let listOfConversionCreatives = []
      const conversionCreatives = await ConversionCreative.find().sort({ createdAt: -1 }).populate({
        path: 'main_creatives_list',
        populate: {
          path: 'campaign_id',
          model: 'Campaign',
          select: 'company_id, _id, name',
          populate: {
            path: 'company_id',
            model: 'Company'
          }
        }
      })
      for (let _conversionCreative of conversionCreatives) {
        if (_conversionCreative.main_creatives_list[0].campaign_id._id.toString() === _campaign._id.toString()) {
          listOfConversionCreatives.push(_conversionCreative)
        }
      }
      res.json(listOfConversionCreatives)
    } else {
      logger.error(`No campaign for the ID: '${_id}'`)
      res.status(400).send(`No campaign for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Campaign Conversion Engagements
// @route   GET /campaign/campaign_conversion_engagement/:id ->Mongodb Object ID (Campaign._id)
// @access  Private
export const getCampaignConversionEngagements = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Campaign with this ID");
      return res.status(400).send("No Campaign with this ID")
    }
    const _campaign = await Campaign.findById(_id).populate('company_id').populate('channel_categories_list').populate('campaign_goal_list').populate('day_sections_list')
    if (_campaign !== null) {
      let listOfConversionEngagement = []
      const conversionEngagements = await ConversionEngagement.find().populate("post_creative_id").populate({
        path: "from_channel_id",
        model: 'Channel',
        select: '_id, title',
      }).populate("channel_id")
      for (let conversionEngagement of conversionEngagements) {
        if (conversionEngagement.post_creative_id.campaign_id._id.toString() === _campaign._id.toString()) {
          listOfConversionEngagement.push(conversionEngagement)
        }
      }
      res.json(listOfConversionEngagement)
    } else {
      logger.error(`No campaign for the ID: '${_id}'`)
      res.status(400).send(`No campaign for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Campaign Posted Ads
// @route   GET /campaign/campaign_posted_ads/:id ->Mongodb Object ID (Campaign._id)
// @access  Private
export const getCampaignPostedAds = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Campaign with this ID");
      return res.status(400).send("No Campaign with this ID")
    }
    const _campaign = await Campaign.findById(_id).populate('company_id').populate('channel_categories_list').populate('campaign_goal_list').populate('day_sections_list')
    if (_campaign !== null) {
      const _campaignPostedAds = await PostedAd.find()
        .populate('channel_id').populate({
          path: 'post_creative_id',
          model: 'PostCreative',
          select: ' _id, name',
          populate: {
            path: 'campaign_id',
            model: 'Campaign',
            select: '_id, name',
          }
        })
        .sort({ createdAt: -1 })

      let listOfCampaignPostedAds = []
      for (let postedAd of _campaignPostedAds) {
        if (postedAd.post_creative_id.campaign_id !== null && _campaign._id.toString() === postedAd.post_creative_id.campaign_id._id.toString()) {
          let view = 0
          let _postedAdStat = await PostedAdStats.findOne({ 'posted_ad_id': postedAd._id })
          if (_postedAdStat !== null) {
            view = _postedAdStat.views
          }
          listOfCampaignPostedAds.push({
            "_id": postedAd._id,
            "message_id": postedAd.message_id,
            "post_creative_id": {
              "_id": postedAd.post_creative_id._id,
              "name": postedAd.post_creative_id.name
            },
            "channel_id": {
              "_id": postedAd.channel_id._id,
              "name": postedAd.channel_id.title,
              "id": postedAd.channel_id.id
            },
            "campaign_id": postedAd.post_creative_id.campaign_id._id,
            "campaign_name": postedAd.post_creative_id.campaign_id.name,
            "view": view,
            "engagement": postedAd.reactions,
            "createdAt": postedAd.createdAt,
            "updatedAt": postedAd.updatedAt,
            "is_deleted": postedAd.is_deleted
          })
        }
      }
      res.json(listOfCampaignPostedAds)
      // res.json(_campaignPostedAds)
    } else {
      logger.error(`No campaign for the ID: '${_id}'`)
      res.status(400).send(`No campaign for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Channels Those Who Approved the Creative
// @route   GET /campaign/channels_approved_creative/:id ->Mongodb Object ID (PostCreative._id)
// @access  Private
export const getChannelsApprovedCreative = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Creative with this ID");
      return res.status(400).send("No Creative with this ID")
    }
    let _postCreative = await PostCreative.findById(_id)
    if (_postCreative !== null) {
      let _stagedPostCreatives = await StagedPostCreative.find({
        "post_creative_id": _postCreative._id,
        "status": "approved"
      }).populate('post_creative_id').populate({
        path: 'channel_id',
        model: 'Channel',
        select: '_id, title',
        populate: {
          path: 'channel_category_id',
          model: 'ChannelCategory',
          select: '_id, category_value',
        }
      })
      res.json(_stagedPostCreatives)
    } else {
      logger.error(`No creative for the ID: '${_id}'`)
      res.status(400).send(`No creative for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Change Campaign Status
// @route   POST /campaign/change_status/:id ->Mongodb Object ID (Campaign._id)
// @access  Private
export const changeCampaignStatus = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No Campaign with this ID");
      return res.status(400).send("No Campaign with this ID")
    }
    if (data.status !== undefined) {
      const _campaign = await Campaign.findById(_id).populate('company_id').populate('channel_categories_list').populate('campaign_goal_list').populate('day_sections_list')
      if (_campaign !== null) {
        let status = data.status
        if (status === 'active') {
          _campaign.status = 'active'
        } else {
          _campaign.status = 'inactive'
        }
        await _campaign.save()
        res.json(_campaign)
      } else {
        logger.error(`No campaign for the ID: '${_id}'`)
        res.status(400).send(`No campaign for the ID: '${_id}'`)
      }
    } else {
      logger.error("status is required")
      res.status(400).send("status is required")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Delete Ad
// @route   POST /campaign/fetch_stat_and_delete_ads/:id ->Mongodb Object ID (PostedAd._id)
// @access  Private
export const fetchStatAndDeleteAd = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid PostedAd ID");
      return res.status(400).send("Invalid PostedAd ID")
    }
    const _postedAd = await PostedAd.findById(_id).populate('channel_id').populate({
      path: 'post_creative_id',
      model: 'PostCreative',
      select: ' _id, name',
      populate: {
        path: 'campaign_id',
        model: 'Campaign',
        select: '_id, name, status',
      }
    })
    if (_postedAd !== null) {
      let message_id = _postedAd.message_id
      let channel_id = _postedAd.channel_id.id

      let response = await manualFetchPostedAdStats([_postedAd])
      if (response.length === [_postedAd].length) {
        let data = {
          "delete_address": [
            [
              parseInt(channel_id.toString()),
              message_id
            ]
          ]
        }
        let delete_res = await sendToAdMasterService(data, 'delete_ad', 'POST')
        if (delete_res[0] === null) {
          _postedAd.is_deleted = true
          await _postedAd.save()
          res.status(202).send("Ad deleted.")
        }
        else {
          logger.error(delete_res[0])
          res.status(400).send(delete_res[0])
        }
      } else {
        _postedAd.is_deleted = true
        await _postedAd.save()
        logger.error("Post stat not found.")
        res.status(400).send("Post stat not found.")
      }
    } else {
      logger.error(`No PostedAd for the ID: '${_id}'`)
      res.status(400).send(`No PostedAd for the ID: '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})