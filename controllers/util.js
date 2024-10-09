import mongoose, { now } from "mongoose"
import logger from "../logger/logger.js"
import Company from "../models/company/company.js"
import { ChannelCategory } from "../models/admin/channelCategory.js"
import DaySection from "../models/admin/daySections.js"
import Campaign from "../models/campaigns/campaigns.js"
import StagedPostCreative, { requiredStagedPostCreativeSchemaObject, stagedPostCreativeSchemaDescription } from "../models/postCreatives/stagedPostCreatives.js"
import PostCreative from "../models/postCreatives/postCreatives.js"
import Channel, { ChannelLastXNumberOfPostStat, ChannelMessage, ChannelMessageStat, ChannelPreference } from "../models/channel.js"
import CampaignGoal from "../models/admin/campaignGoal.js"
import PostedAd from "../models/postedAds/postedAds.js"
import axios from "axios"
import moment from "moment-timezone"
import PostedAdForIndividual from "../models/postedAds/postedAdForIndividual.js"
import PostCreativePaymentValues from "../models/postCreatives/postCreativePaymentValues.js"
import Account, { requiredAccountBalanceHistoryDescription, requiredAccountBalanceHistoryObject } from "../models/account/account.js"
import { ACTION_TYPES, ADMIN_ACCOUNT_INITIAL_BALANCE, CHANNEL_REPORT_HTML_CONTENT_FOR_CAMPAIGN, LAST_POST_COUNT, REACTION_TYPES, REPORT_HTML_CONTENT, REPORT_HTML_CONTENT_FOR_CHANNEL, REQUIRED_CREATIVE_BUTTON_CONTENT, TABLE_ROW, TABLE_ROW_CONTENT_DATA, VIEW_INDICATORS } from "./constants.js"
import AccountTransaction, { requiredAccountTransactionSchemaDescription, requiredAccountTransactionSchemaObject } from "../models/account/accountTransaction.js"
import AccountBalanceLog, { requiredAccountBalanceLogSchemaDescription, requiredAccountBalanceLogSchemaObject } from "../models/account/accountBalanceLogs.js"
import { fetchChannelMessageAndSaveStats, fetchStats } from "./stat_service.js"
import PostedAdStats from "../models/postedAds/postedAdStats.js"
import puppeteer from "puppeteer"
import fs, { readFileSync, writeFileSync } from 'fs';
import FormData from 'form-data';
import ConversionCreative from "../models/postCreatives/conversionCreative.js"

export const AD_CREATIVE_TYPES = {
  "TEXT": "text",
  "PHOTO": "photo",
  "VIDEO": "video"
}

export const checkIntersection = (a, b) => {
  return new Set([...a].filter(i => b.has(i)))
}

export const returnErrorMessage = (requiredFields, providedFields, schemaDescription) => {
  for (let i = 0; i < requiredFields.length; i++) {
    if (!providedFields.has(requiredFields[i])) {
      return `${schemaDescription[requiredFields[i]]}(${requiredFields[i]}) is required!`
    }
  }
}

export const returnExtraObject = (requiredFieldsList, currentObject) => {
  let keys = Object.keys(currentObject)
  let extra_info = {}
  for (let i = 0; i < keys.length; i++) {
    if (!requiredFieldsList.has(keys[i])) {
      extra_info[`${keys[i]}`] = currentObject[keys[i]]
    }
  }
  return extra_info
}


export const checkEmptyString = (data) => {
  let keys = Object.keys(data)
  for (let i = 0; i < keys.length; i++) {
    if (data[keys[i]].toString().trim().length == 0) {
      return keys[i]
    }
  }
  return null

}

export const logStackTrace = (errorStack) => {
  // throw new Error("something went wrong.")
  // if (process.env.NODE_ENV === 'development') {
  logger.error(errorStack)
  // }
}


export const validatePermissions = (permission, modelsList, isForce) => {
  // console.log(permission)
  // console.log(modelsList)
  // console.log(isForce)
  let validPermissions = ['create', 'update', 'delete', 'read']
  for (const key in permission) {
    if (isForce) {
      let permissionsList = permission[key]
      for (const p of permissionsList) {
        if (!validPermissions.includes(p)) {
          return `Invalid permission in ${key}: ${permissionsList} for value '${p}', valid permissions are ${validPermissions}`
        }
      }
    } else {
      if (!modelsList.includes(key.toString().toLowerCase())) {
        return `Table/collection (${key}) not found, try with (force=true) in the request body.This is not suggested if you don't know what you are doing.`
      } else {
        let permissionsList = permission[key]
        for (const p of permissionsList) {
          if (!validPermissions.includes(p)) {
            return `Invalid permission in ${key}: ${permissionsList} for value '${p}', valid permissions are ${validPermissions}`
          }
        }
      }
    }
  }
  return null
}

export const convertKeysToLowerCase = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key.toLowerCase()] = obj[key];
    return acc;
  }, {})
}
export const validateIDs = async (model, list_of_keys) => {
  let validated_list = []
  for (let id of list_of_keys) {
    if (!mongoose.Types.ObjectId.isValid(id)) return [null, id]
    let _result = await model.findOne({ '_id': id })
    if (_result === null) return [null, id]
    validated_list.push(_result._id)
  }
  return [validated_list, ""]
}

export const validateStartAndEndDate = (start_date, end_date) => {
  const diffInMs = Math.abs(end_date.getTime() - start_date.getTime());

  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  console.log(diffInDays);
  return diffInDays > 0
}

export const validateBodyForCampaign = async (data, campaign_id) => {
  let company_id = data.company_id
  let channel_categories_list = data.channel_categories_list
  let list_of_day_sections = data.day_sections_list
  let list_of_campaign_goals = data.campaign_goal_list
  let start_date = data.campaign_start_date
  let end_date = data.campaign_end_date
  let campaign_start_date = null
  let campaign_end_date = null
  if (company_id !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(company_id)) return "Invalid companyID"
    const _company = await Company.findOne({ '_id': company_id })
    if (_company === null) return `No company found under the ID ${company_id}`
  }
  if (channel_categories_list !== undefined) {
    let isValid = await validateIDs(ChannelCategory, channel_categories_list)
    if (isValid[0] === null) return `No channel category under the ID '${isValid[1]}'`
  }
  if (list_of_day_sections !== undefined) {
    let isValid = await validateIDs(DaySection, list_of_day_sections)
    if (isValid[0] === null) return `No day section under the ID '${isValid[1]}'`
  }
  if (list_of_campaign_goals !== undefined) {
    let isValid = await validateIDs(CampaignGoal, list_of_campaign_goals)
    if (isValid[0] === null) return `No campaign goal under the ID '${isValid[1]}'`
  }
  if (start_date !== undefined) {
    campaign_start_date = new Date(start_date)
  }
  if (end_date !== undefined) {
    campaign_end_date = new Date(end_date)
  }

  if (campaign_start_date !== null && campaign_end_date !== null) {
    let isDatesValid = campaign_start_date < campaign_end_date
    if (!isDatesValid) return `end_date(${campaign_end_date}) should be after start_date(${campaign_start_date})`
  }
  if ((campaign_start_date !== null || campaign_end_date !== null) && campaign_id !== null) {
    if (!mongoose.Types.ObjectId.isValid(campaign_id)) return "Invalid campaign ID"
    const _campaign = await Campaign.findById({ _id: campaign_id })
    if (_campaign === null) return `No campaign found under the ID ${campaign_id}`
    if (campaign_start_date !== null) {
      // validate for start_date
      let _end_date = _campaign.campaign_end_date
      let _campaign_end_date = new Date(_end_date)
      let isDatesValid = campaign_start_date < _campaign_end_date
      if (!isDatesValid) return `end_date(${_campaign_end_date}) should be after start_date(${campaign_start_date})`

    } else {
      // validate for end_date
      let _start_date = _campaign.campaign_start_date
      let _campaign_start_date = new Date(_start_date)
      let isDatesValid = _campaign_start_date < campaign_end_date
      if (!isDatesValid) return `end_date(${campaign_end_date}) should be after start_date(${_campaign_start_date})`

    }
  }
  return null
}

export const validateBodyForConversionCreative = async (data) => {
  let main_creatives_list = data.main_creatives_list
  let image_urls = data.image_urls
  let video_urls = data.video_urls
  let button_list = data.button_list
  let has_button = data.has_button

  if (main_creatives_list !== undefined) {
    for (let creative of main_creatives_list) {
      if (!mongoose.Types.ObjectId.isValid(creative)) return `No creative with ID ${creative}`
      const _creative = await PostCreative.findById(creative)
      if (_creative === null) return `No creative with ID ${creative}`
    }
  }

  if (image_urls !== undefined) {
    if (!Array.isArray(image_urls)) return "Image URLs(image_urls) should be list of image URLs"
  }
  if (video_urls !== undefined) {
    if (!Array.isArray(video_urls)) return "Video URLs(video_urls) should be list of video URLs"
  }
  if (button_list !== undefined) {
    if (!Array.isArray(button_list)) return "Button list(button_list) should be list of button objects"
  }
  if (has_button && button_list.length == 0) return "has_button is true with an empty button_list"

  return null
}

export const validateArray = (items, required_keys) => {

  // Iterate over each item in the array
  for (const item of items) {
    // Check if all required keys are present in the current item
    const keysPresent = required_keys.every(key => Object.keys(item).includes(key));

    // If any required key is missing, return false
    if (!keysPresent) {
      return false;
    }
  }

  // If all items have the required keys, return true
  return true;
}

export const validateBodyForPostCreative = async (data, post_creative_id) => {
  let campaign_id = data.campaign_id
  let image_urls = data.image_urls
  let video_urls = data.video_urls
  let button_list = data.button_list
  let has_button = data.has_button
  let has_conversion = data.has_conversion
  let conversion_title = data.conversion_title
  let conversion_bot_username = data.conversion_bot_username
  let has_phone = data.has_phone_number
  let phone_number = data.phone_number
  let has_visit_us = data.has_visit_us
  let website = data.website
  let visit_us_title = data.visit_us_title

  if (campaign_id !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(campaign_id)) return 'No campaign with that ID'
    const _campaign = await Campaign.findById(campaign_id)
    if (_campaign === null) return "No campaign with that ID"
  }

  if (image_urls !== undefined) {
    if (!Array.isArray(image_urls)) return "Image URLs(image_urls) should be list of image URLs"
  }
  if (video_urls !== undefined) {
    if (!Array.isArray(video_urls)) return "Video URLs(video_urls) should be list of video URLs"
  }
  if (button_list !== undefined) {
    if (!Array.isArray(button_list)) return "Button list(button_list) should be list of button objects"
    if (!validateArray(button_list, REQUIRED_CREATIVE_BUTTON_CONTENT)) return `Each button in button_list should include ${REQUIRED_CREATIVE_BUTTON_CONTENT}`
  }
  if (has_button && button_list.length == 0) return "has_button is true with an empty button_list"

  if (has_conversion && (conversion_title === undefined || conversion_title.length === 0)) return "has_conversion is true with an empty conversion title"
  if (has_conversion && (conversion_bot_username === undefined || conversion_bot_username.length === 0)) return "has_conversion is true with an empty conversion bot username"

  if (has_phone && (phone_number === undefined || phone_number.length === 0)) return "has_phone_number is true with an empty phone number"

  if (has_visit_us && (website === undefined || website.length === 0)) return "has_visit_us is true with an empty website link"

  if (has_visit_us && (website === undefined || visit_us_title.length === 0)) return "has_visit_us is true with an empty button title"


  return null

}

export const updateStatusOfStagedPostCreative = async (_id, action, req) => {
  if (!mongoose.Types.ObjectId.isValid(_id)) return ["No staged post creative with that ID", null]
  const _stagedPostCreative = await StagedPostCreative.findById(_id)
  if (_stagedPostCreative !== null) {
    let status = _stagedPostCreative.status
    if ((status === "delayed" || status === "staged") && status !== action) {
      let data = {}
      data[`${action}_at`] = Date.now()
      data['status'] = action
      // console.log(data['status_record'])
      let obj = _stagedPostCreative['status_record'] === undefined ? [] : _stagedPostCreative['status_record']
      let tempObj = [{
        "status": action,
        "timestamp": Date.now(),
        "user": req.auth._id
      }]
      data['status_record'] = [
        ...obj, ...tempObj
      ]
      // console.log(data['status_record'])

      const updatedStagedPostCreative = await StagedPostCreative.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
      return [null, updatedStagedPostCreative]
    } else {
      return [`This staged post creative can not be ${action}, it has a status of '${status}'`, null]
    }
  } else {
    return [`No staged post creative found under ID '${_id}'`, null]
  }
}

export const validateAndCreateStagedCreative = async (data) => {
  const dataSet = new Set(Object.keys(data))
  const schemaSet = new Set(Object.keys(requiredStagedPostCreativeSchemaObject))
  let intersection = checkIntersection(schemaSet, dataSet)
  if ([...intersection].length == [...schemaSet].length) {
    let _postCreativeID = data.post_creative_id
    let _channelID = data.channel_id
    if (!mongoose.Types.ObjectId.isValid(_postCreativeID)) {
      return ["No post creative with this ID", null]
    }
    if (!mongoose.Types.ObjectId.isValid(_channelID)) {
      return ["No channel this ID", null]
    }
    const _postCreative = await PostCreative.findById(_postCreativeID)
    const _channel = await Channel.findById(_channelID)
    if (_postCreative !== null && _channel !== null) {
      const _stagedPostCreative = await StagedPostCreative.count({
        'post_creative_id': _postCreativeID,
        'channel_id': _channelID
      })
      if (_stagedPostCreative === 0) {
        const newStagedPostCreative = new StagedPostCreative(data)
        await newStagedPostCreative.save()
        return [null, newStagedPostCreative]
        // return [null, data]
      } else {
        return [`The post creative ${_postCreative.name}(${_postCreativeID}) has been already staged for the channel ${_channel.title}(${_channelID})`, null]
      }
    } else {
      let message = ""
      if (_postCreative !== null) {
        message = `No channel with the ID ${_channelID}`
      } else {
        message = `No post creative with the ID ${_postCreativeID}`
      }
      return [message, null]
    }
  } else {
    let message = returnErrorMessage(Object.keys(requiredStagedPostCreativeSchemaObject), dataSet, stagedPostCreativeSchemaDescription)
    return [message, null]
  }
}


export const validatedListForStagedPostCreatives = async (list, required_keys = ["post_creative_id", "channel_id"]) => {
  let listOfPostCreativeIDs = []
  let listOfChannelID = []
  for (let obj of list) {
    let keysSet = Object.keys(obj)
    const difference = required_keys.filter(item => !keysSet.includes(item));
    if (difference.length !== 0) {
      return `${difference[0]} is required in ${obj}`
    }
    const _channel = await Channel.findById(obj.channel_id)
    const _postCreative = await PostCreative.findById(obj.post_creative_id)
    const _stagedPostCreative = await StagedPostCreative.count({
      'post_creative_id': obj.post_creative_id,
      'channel_id': obj.channel_id
    })
    console.log(_stagedPostCreative)
    if (_stagedPostCreative > 0) return `The post creative ${_postCreative.name}(${obj.post_creative_id}) has been already staged for the channel ${_channel.title}(${obj.channel_id})`
    listOfPostCreativeIDs.push(obj.post_creative_id)
    listOfChannelID.push(obj.channel_id)
  }

  let validatedPostCreativeIDs = await validateIDs(PostCreative, listOfPostCreativeIDs)
  if (validatedPostCreativeIDs[0] === null) return `Invalid post creative id at ${validatedPostCreativeIDs[1]}`
  let validatedChannelIDs = await validateIDs(Channel, listOfChannelID)
  if (validatedChannelIDs[0] === null) return `Invalid channel id at ${validatedChannelIDs[1]}`

  return null
}

export const validateListForCampaignGoal = async (list, required_keys = ["campaign_goal_key", "campaign_goal_value"]) => {
  for (let obj of list) {
    const keys = Object.keys(obj)
    const difference = required_keys.filter(item => !keys.includes(item))
    if (difference.length !== 0) {
      return `${difference[0]} is required in ${obj}`
    }
    const _campaignGoal = await CampaignGoal.findOne({ 'campaign_goal_key': obj.campaign_goal_key })
    if (_campaignGoal !== null) return `Campaign goal with key '${obj.campaign_goal_key}' already exists.`
  }
  return null
}

export const validateBodyForPostedAds = async (data) => {
  let channel_id = data.channel_id
  let post_creative_id = data.post_creative_id
  let message_id = data.message_id
  let _channel = undefined

  if (channel_id !== undefined) {
    _channel = await Channel.findOne({ 'id': data.channel_id })
    if (_channel === null) return [`No channel found under the ID '${data.channel_id}'`, null]
  }
  if (post_creative_id !== undefined) {
    const _postCreative = await PostCreative.findById(data.post_creative_id)
    if (_postCreative === null) return [`No posted creative found under the ID '${data.post_creative_id}'`, null]
  }
  if (message_id !== undefined && channel_id !== undefined) {
    const _postedAd = await PostedAd.count({ "message_id": data.message_id, "channel_id": _channel._id })
    if (_postedAd > 0) return ["Message ID already exist in this channel.", null]
  }
  return [null, _channel]
}



export const getDaySectionBasedOnCurrentTime = async () => {
  let now = moment.tz(Date.now(), 'Africa/Addis_Ababa').format('h:mma z');
  console.log(now)
  let time = now.toString().split(' ')[0].toUpperCase()
  console.log(time)
  let mainTime = getMeridiemFromTime(time)
  console.log(mainTime)
  let daySection = await getDaySectionFromTime(mainTime)
  return daySection
}

export const checkIfCampaignIsActive = (campaign_end_time) => {
  let now = moment.tz(Date.now(), 'Africa/Addis_Ababa')
  let end_date = moment.tz(Date.parse(campaign_end_time), 'Africa/Addis_Ababa')
  return now < end_date
}

export const getCampaignsBasedOnActiveStatusAndDaySection = async (daySection) => {
  const _campaigns = await Campaign.find({ "status": "active" })
  let listOfCampaignsFilteredWithDaySection = []
  for (let campaign of _campaigns) {
    if (campaign.day_sections_list.includes(daySection)
      && checkIfCampaignIsActive(campaign.campaign_end_date)) {
      listOfCampaignsFilteredWithDaySection.push(campaign)
    }
  }
  return listOfCampaignsFilteredWithDaySection
}

export const postAdAutoService = async () => {
  let daySection = await getDaySectionBasedOnCurrentTime()
  if (daySection !== null) {
    let listOfCampaigns = await getCampaignsBasedOnActiveStatusAndDaySection(daySection._id)
    if (listOfCampaigns.length > 0) {
      const now = moment.tz(Date.now(), 'Africa/Addis_Ababa').format('YYYY-MM-DD')

      const today = Date(`${now} GMT`);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tmw = moment.tz(tomorrow, 'Africa/Addis_Ababa').format('YYYY-MM-DD')


      let postedAdsList = []
      for (let campaign of listOfCampaigns) {
        let _campaignCreatives = await PostCreative.find({ "campaign_id": campaign._id, 'is_active': true })
        for (let creative of _campaignCreatives) {
          let channels_list = []
          console.log(creative.name)
          let _stagedPostCreatives = await StagedPostCreative.find({ "post_creative_id": creative._id, "status": "approved" })

          for (let stagedPostCreative of _stagedPostCreatives) {
            const postCount = await PostedAd.count({
              createdAt: { $gte: now, $lt: tmw },
              channel_id: stagedPostCreative.channel_id
            })
            if (postCount === 0) {
              const _channelPref = await ChannelPreference.findOne({ channel_id: stagedPostCreative.channel_id })
              const _channel = await Channel.findById(stagedPostCreative.channel_id)
              if (_channelPref !== null && _channel !== null) {
                if (_channelPref.post_time_ids.includes(daySection._id) && _channel.is_active === true) {
                  channels_list.push(stagedPostCreative.channel_id)
                }
              }

            }
          }
          console.log(channels_list)
          //POST
          if (channels_list.length > 0) {
            let bodyData = await preparePostMessageForAdMasterPostAdService(creative._id, channels_list)
            if (bodyData[0] === null) {
              const result = await sendToAdMasterService(bodyData[1])
              if (result[0] === null) {
                let response = result[1]
                const saveResult = await savePostedAd(creative._id, response)
                if (saveResult[0] === null) {
                  postedAdsList.push(saveResult[1])
                } else {
                  logger.error(saveResult[0])
                }
              } else {
                logger.error(result[0])
              }
            } else {
              logger.error(bodyData[0])
            }
          }
        }
      }
      logger.info(postedAdsList)
      return postedAdsList
    } else {
      logger.error("No campaign found")
    }
    return []
  }

}

export const getMeridiemFromTime = (time) => {
  let hasP = time.includes('P')
  if (hasP) return time.split('P').join(' P').split(' ')
  return time.split('A').join(' A').split(' ')
}

export const getDaySectionFromTime = async (time) => {
  const _daySections = await DaySection.find()
  let now = moment.tz(Date.now(), 'Africa/Addis_Ababa')
  const currentTime = new Date(now.toDate());
  for (let daySection of _daySections) {
    let start_time = daySection.start_time
    let end_time = daySection.end_time

    let startMainTime = getMeridiemFromTime(start_time)
    let endMainTime = getMeridiemFromTime(end_time)

    let day_section_start_time = moment.tz(Date.now(), 'Africa/Addis_Ababa')
    let convertedTime = covertTo24Hrs(startMainTime)
    day_section_start_time.set({
      hour: convertedTime[0],
      minute: convertedTime[1], second: 0, millisecond: 0
    })

    let day_section_end_time = moment.tz(Date.now(), 'Africa/Addis_Ababa')
    convertedTime = covertTo24Hrs(endMainTime)
    day_section_end_time.set({
      hour: convertedTime[0],
      minute: convertedTime[1], second: 0, millisecond: 0
    })


    if (day_section_start_time < currentTime && day_section_end_time > currentTime) return daySection
  }
  return null
}

export const covertTo24Hrs = (time) => {
  let [hr, minute] = time[0].split(":")
  if (time[1] == 'PM') {
    return [parseInt(hr) + 12, parseInt(minute)]
  } return [parseInt(hr), parseInt(minute)]
}


export const validateBodyForPostAdManually = async (data) => {
  let post_creative_id = data.post_creative_id
  let channels_list = data.channel_list

  if (!mongoose.Types.ObjectId.isValid(post_creative_id)) {
    return "No post creative with this ID"
  }
  const _postCreative = await PostCreative.findById(post_creative_id)
  if (_postCreative === null) return `No posted creative found under the ID '${data.post_creative_id}'`

  if (!Array.isArray(channels_list)) return "List of channel ID's(channel_list) should be list of Channels"

  let isValid = await validateIDs(Channel, channels_list)
  if (isValid[0] === null) return `No channel under the ID '${isValid[1]}'`

  return null
}

export const returnChannelTelegramIDFromList = async (list) => {
  let list_of_id = []

  for (let channel_id of list) {
    let _channel = await Channel.findById(channel_id)
    if (_channel === null) return [`No channel found under the ID '${channel_id}'`, null]
    list_of_id.push(_channel.id)
  }
  return [null, list_of_id]
}

export const preparePostMessageForAdMasterPostAdService = async (post_creative_id, channel_list) => {
  let data = {}
  const _postCreative = await PostCreative.findById(post_creative_id)
  if (_postCreative === null) return [`No posted creative found under the ID '${post_creative_id}'`, null]

  let isValid = await returnChannelTelegramIDFromList(channel_list)
  if (isValid[0] !== null) return [isValid[0], null]

  data["channel_ids"] = isValid[1]
  data['creative_id'] = _postCreative._id
  data['channel_object_ids'] = [...channel_list]
  let ad_creative_data = {}
  let ad_creative_type = getAdCreativeTypeFromPostCreative(_postCreative)
  ad_creative_data['ad_creative_type'] = ad_creative_type
  ad_creative_data['content_text'] = _postCreative.content_text.toString().replace(/<\/?p>/g, '').replace(/<br>/g, '\n\n')
  if (ad_creative_type === AD_CREATIVE_TYPES.PHOTO || ad_creative_type === AD_CREATIVE_TYPES.VIDEO) {
    if (ad_creative_type === AD_CREATIVE_TYPES.PHOTO) {
      ad_creative_data['photo_url'] = _postCreative.image_urls[0]
    } else {
      ad_creative_data['video_url'] = _postCreative.video_urls[0]
    }
    // ad_creative_data['caption'] = _postCreative.content_text
  }
  ad_creative_data['has_phone'] = _postCreative.has_phone_number
  ad_creative_data['has_website'] = _postCreative.has_visit_us
  ad_creative_data['visit_us_title'] = _postCreative.visit_us_title
  ad_creative_data['has_seemore'] = _postCreative.has_see_more

  ad_creative_data['has_buttons'] = _postCreative.has_button
  ad_creative_data['buttons_list'] = _postCreative.button_list

  ad_creative_data['has_conversion'] = _postCreative.has_conversion

  ad_creative_data['conversion_title'] = _postCreative.conversion_title
  ad_creative_data['conversion_bot_username'] = _postCreative.conversion_bot_username

  data['ad_creative'] = ad_creative_data

  return [null, data]

}

export const getChannelPublisherTelegramIDs = async (channel_list) => {
  let user_ids = []

  for (let channel_id of channel_list) {
    let _channel = await Channel.findById(channel_id).populate("user_id")
    if (_channel === null) return [`No channel found under the ID '${channel_id}'`, null]
    user_ids.push(_channel.user_id.id.toString())
  }
  return [null, user_ids]
}

export const getChannelHandleFromID = async (channel_id) => {
  if (!mongoose.Types.ObjectId.isValid(channel_id)) {
    return " "
  }
  let _channel = await Channel.findById(channel_id)
  return _channel !== null ? _channel.channel_handle : " "
}

export const prepareBodyForPublisherManagementService = async (staged_creatives) => {
  let staged_ids = []
  let channel_ids = []
  let publisher_names = []
  let post_creative_id = staged_creatives[0].post_creative_id
  for (let staged_creative of staged_creatives) {
    staged_ids.push(staged_creative._id.toString())
    channel_ids.push(staged_creative.channel_id)
    let channel_handle = await getChannelHandleFromID(staged_creative.channel_id)
    publisher_names.push(channel_handle)
  }

  const _postCreative = await PostCreative.findById(post_creative_id).populate('campaign_id')
  if (_postCreative === null) return [`No posted creative found under the ID '${data.post_creative_id}'`, null]

  let isValid = await getChannelPublisherTelegramIDs(channel_ids)
  if (isValid[0] !== null) return [isValid[0], null]

  let data = {
    "stage_ids": staged_ids,
    "publishers": isValid[1],
    "publisher_names": publisher_names
  }

  let ad_creative_data = {}
  let ad_creative_type = getAdCreativeTypeFromPostCreative(_postCreative)
  ad_creative_data['ad_creative_type'] = ad_creative_type
  let intro = `The Campaign <strong>${_postCreative.campaign_id.name}</strong> will run from <strong>${_postCreative.campaign_id.campaign_start_date}</strong> - <strong>${_postCreative.campaign_id.campaign_end_date}</strong> and will be posted on your channel[CHANNEL_HANDLE] \n\n`
  let content_text = _postCreative.content_text.toString().replace(/<\/?p>/g, '').replace(/<br>/g, '\n\n')
  ad_creative_data['content_text'] = `${intro} \n ${content_text}`
  if (ad_creative_type === AD_CREATIVE_TYPES.PHOTO || ad_creative_type === AD_CREATIVE_TYPES.VIDEO) {
    if (ad_creative_type === AD_CREATIVE_TYPES.PHOTO) {
      ad_creative_data['photo_url'] = _postCreative.image_urls[0]
    } else {
      ad_creative_data['video_url'] = _postCreative.video_urls[0]
    }
  }
  data['ad_creative'] = ad_creative_data

  return [null, data]
}

export const getAdCreativeTypeFromPostCreative = (postCreative) => {
  let ad_creative_type = AD_CREATIVE_TYPES.TEXT
  let imageURLs = postCreative.image_urls
  let videoURLs = postCreative.video_urls
  if (imageURLs.length > 0) return AD_CREATIVE_TYPES.PHOTO
  if (videoURLs.length > 0) return AD_CREATIVE_TYPES.VIDEO
  return ad_creative_type
}

export const sendToAdMasterService = async (data, end_point = 'post_ad', method = 'POST') => {
  try {
    let URL = process.env.SERVICE_URL
    if (method === 'POST') {
      const response = await axios.post(`${URL}/ad/${end_point}/`, data)
      // console.log(response)
      logger.info(`${end_point} requested`)
      return [null, response.data]
    } else if (method === 'DELETE') {
      const response = await axios.delete(`${URL}/ad/${end_point}/`, data)
      // console.log(response)
      logger.info(`${end_point} requested`)
      return [null, response.data]
    } else {
      return ["Method not implemented yet.", null]
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    return [error.message, null]
  }
}

export const sendToPublisherManagementService = async (data, end_point = 'send_staged_ad', headers = {}, query_params = {}) => {
  try {
    let header = {
      params: { ...query_params },
      headers: {
        ...headers
      }
    }
    let URL = process.env.SERVICE_URL
    const response = await axios.post(`${URL}/publisher/${end_point}/`, data, header)
    // console.log(response.data)
    // logger.info("Staged creative sent to channels")
    logger.info(`${end_point} requested`)
    return [null, response.data]
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    return [error.message, null]
  }
}

export const savePostedAd = async (post_creative_id, response) => {
  let postedAdList = []
  let errorMessage = null
  for (let res of response) {
    const _channel = await Channel.findOne({ "id": res.channel_id })
    if (_channel !== null) {
      postedAdList.push({
        "message_id": res.message_id,
        "channel_id": _channel._id,
        "post_creative_id": post_creative_id
      })
    } else {
      errorMessage = `Telegram channel not found for ${res.channel_id}`
    }
  }
  let insertedList = await PostedAd.insertMany(postedAdList)
  return [errorMessage, insertedList]
}

export const validateScheduleTime = async (data) => {
  /*
    Expected format: 
      start_time: 2:00 AM 
      end_time: 3:00 AM 

      start_time: 11:00 AM 
      end_time: 12:00 PM
  */
  let start_time = data.start_time
  let end_time = data.end_time
  let start_time_splitted = start_time.toString().split(' ')
  let end_time_splitted = end_time.toString().split(' ')

}

export const getChannelCategoryIDsForContentInterest = async (content_interest) => {
  let ids = []
  for (let interest of content_interest) {
    const _channelCategory = await ChannelCategory.findOne({ 'category_key': interest })
    if (_channelCategory !== null) {
      ids.push(_channelCategory._id.toString())
    }
  }
  return ids
}


export const getCampaignListForIndividuals = async (_preference) => {
  const campaigns = await Campaign.find({ "status": "active" })
  if (_preference === null) return campaigns
  let contentInterestIds = _preference.content_interest_ids
  let filteredCampaignsWithPreference = []
  for (let campaign of campaigns) {
    let campaignCategoryList = campaign.channel_categories_list

    const categoryDifference = campaignCategoryList.filter(item => !contentInterestIds.includes(item.toString()))

    if (contentInterestIds.length > 0) {
      if (categoryDifference.length < campaignCategoryList.length) filteredCampaignsWithPreference.push(campaign)
    }

  }
  return filteredCampaignsWithPreference
}

export const getCampaignCreatives = async (campaigns) => {
  let listOfCreatives = []
  for (let campaign of campaigns) {
    let postCreatives = await PostCreative.find({ 'campaign_id': campaign._id })
    if (postCreatives.length > 0) listOfCreatives.push(...postCreatives)
  }
  return listOfCreatives
}



export const getCreativeToBePostedForIndividual = async (campaignsCreatives, userChannel, creativesIdsList = [], isOnlyImage = false) => {
  let creativeToBePosted = null
  let earlyPostsDates = {}
  let earlyPosts = {}
  for (let campaignsCreative of campaignsCreatives) {
    let _postedAdForIndividual = await PostedAdForIndividual.find({ "channel_id": userChannel._id, "post_creative_id": campaignsCreative._id }).sort({ createdAt: -1 })
    _postedAdForIndividual = _postedAdForIndividual[0]
    if (_postedAdForIndividual === null || _postedAdForIndividual === undefined) {
      if (!creativesIdsList.includes(campaignsCreative._id)) {
        if (isOnlyImage) {
          let ad_creative_type = getAdCreativeTypeFromPostCreative(campaignsCreative)
          if (ad_creative_type === AD_CREATIVE_TYPES.PHOTO) {
            creativeToBePosted = campaignsCreative
            break
          }
        } else {
          creativeToBePosted = campaignsCreative
          break
        }
      }
    } else {
      let now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
      const diffInDays = Math.round(Math.abs((_postedAdForIndividual.createdAt - now) / oneDay));
      earlyPostsDates[_postedAdForIndividual._id] = diffInDays
      earlyPosts[_postedAdForIndividual._id] = campaignsCreative
    }
  }

  if (creativeToBePosted === null) {
    let sorted = sortDictionaryByValue(earlyPostsDates)
    let key = Object.keys(sorted)[Object.keys(sorted).length - 1]
    let keys = Object.keys(sorted)
    for (let i = keys.length - 1; i >= 0; i--) {
      if (sorted[keys[i]] > 1) {
        if (!creativesIdsList.includes(earlyPosts[keys[i]]._id)) {
          if (isOnlyImage) {
            let ad_creative_type = getAdCreativeTypeFromPostCreative(earlyPosts[keys[i]])
            if (ad_creative_type === AD_CREATIVE_TYPES.PHOTO) {
              creativeToBePosted = earlyPosts[keys[i]]
              break
            }
          } else {
            creativeToBePosted = earlyPosts[keys[i]]
            break
          }
        }
      }
    }
    // if (sorted[key] > 1) {
    //   creativeToBePosted = earlyPosts[key]
    // }
  }

  return creativeToBePosted

}

function sortDictionaryByValue(dictionary) {
  // Convert the dictionary to an array of key-value pairs
  const entries = Object.entries(dictionary);

  // Sort the array based on the values
  entries.sort((a, b) => a[1] - b[1]);

  // Convert the sorted array back to a dictionary
  const sortedDictionary = {};
  for (const [key, value] of entries) {
    sortedDictionary[key] = value;
  }

  return sortedDictionary;
}

export const prepareBodyForIndividualService = (postCreative, user_id, bot_token) => {
  let data = {
    "user_id": user_id.toString(),
    "bot_token": bot_token
  }
  let ad_creative_data = {}
  let ad_creative_type = getAdCreativeTypeFromPostCreative(postCreative)
  ad_creative_data['ad_creative_type'] = ad_creative_type
  ad_creative_data['content_text'] = postCreative.content_text.toString().replace(/<\/?p>/g, '').replace(/<br>/g, '\n\n')
  if (ad_creative_type === AD_CREATIVE_TYPES.PHOTO || ad_creative_type === AD_CREATIVE_TYPES.VIDEO) {
    if (ad_creative_type === AD_CREATIVE_TYPES.PHOTO) {
      ad_creative_data['photo_url'] = postCreative.image_urls[0]
    } else {
      ad_creative_data['video_url'] = postCreative.video_urls[0]
    }
    // ad_creative_data['caption'] = _postCreative.content_text
  }
  ad_creative_data['has_phone'] = postCreative.has_phone_number
  ad_creative_data['has_website'] = postCreative.has_visit_us
  ad_creative_data['visit_us_title'] = _postCreative.visit_us_title
  ad_creative_data['has_dislike'] = postCreative.has_dislike
  ad_creative_data['has_like'] = postCreative.has_like

  ad_creative_data['has_buttons'] = postCreative.has_button
  ad_creative_data['buttons_list'] = postCreative.button_list

  data['ad_creative'] = ad_creative_data
  return data
}

export const sendToIndividualService = async (data, end_point = 'show_ad') => {
  try {
    let URL = process.env.SERVICE_URL
    const response = await axios.post(`${URL}/${end_point}/`, data)
    logger.info(`${end_point} requested`)
    return [null, response.data]
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    return [error.message, null]
  }

}

export const addDefaultValuesForPostCreatives = async (postCreative, paymentModes) => {
  try {
    let _postCreativePaymentValue = await PostCreativePaymentValues.findOne({ 'post_creative_id': postCreative._id })
    let keys = []
    if (_postCreativePaymentValue !== null) {
      if (_postCreativePaymentValue.values !== undefined) {
        keys = Object.keys(_postCreativePaymentValue.values)
      }
    } else {
      _postCreativePaymentValue = new PostCreativePaymentValues({ 'post_creative_id': postCreative._id })
      await _postCreativePaymentValue.save()
    }
    console.log(keys)
    for (let postCreativePaymentMode of paymentModes) {
      if (!keys.includes(postCreativePaymentMode.name)) {
        let name = postCreativePaymentMode.name
        let vals = {
          ..._postCreativePaymentValue.values
        }
        vals[name] = postCreativePaymentMode.default_price
        _postCreativePaymentValue.values = { ...vals }
        // _postCreativePaymentValue.values.set(`${postCreativePaymentMode.name}`, `${postCreativePaymentMode.default_price}`)
      }
    }
    await _postCreativePaymentValue.save()
    return [null, _postCreativePaymentValue]
  } catch (error) {
    return [error.message, null]
  }
}

export const validateNumber = (input) => {
  const regex = /^\d*\.?\d+$/;
  return regex.test(input);
}

export const createOrGetAccount = async (channelId, isAdmin) => {
  let _account = null
  if (isAdmin) {
    _account = await Account.findOne({ 'is_admin': true })
    if (_account === null) {
      _account = new Account({
        "is_admin": true,
        "balance": ADMIN_ACCOUNT_INITIAL_BALANCE.toString()
      })
      await _account.save()
    }
  } else {
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return ["Invalid Channel ID", null]
    }
    _account = await Account.findOne({ 'channel_id': channelId })
    if (_account === null) {
      const _channel = await Channel.findById(channelId)
      if (_channel !== null) {
        _account = new Account({
          "is_admin": false,
          "channel_id": _channel._id,
          "balance": "0.00"
        })
        _account.save()
      }
      else {
        return ["Channel not found!", null]
      }
    }
  }
  if (_account !== null) return [null, _account]
  return ["Account can't be created.", _account]
}

export const createAccountTransaction = async (data) => {
  const dataSet = new Set(Object.keys(data))
  let schemaSet = new Set(Object.keys(requiredAccountTransactionSchemaObject))
  const intersection = checkIntersection(schemaSet, dataSet)
  if ([...intersection].length === [...schemaSet].length) {
    const newAccountTransaction = new AccountTransaction(data)
    await newAccountTransaction.save()
    return [null, newAccountTransaction]
  } else {
    let message = returnErrorMessage(Object.keys(requiredAccountTransactionSchemaObject), dataSet, requiredAccountTransactionSchemaDescription)
    return [message, null]
  }
}

export const createAccountBalanceLog = async (data) => {
  const dataSet = new Set(Object.keys(data))
  let schemaSet = new Set(Object.keys(requiredAccountBalanceLogSchemaObject))
  const intersection = checkIntersection(schemaSet, dataSet)
  if ([...intersection].length === [...schemaSet].length) {
    const newAccountBalanceLog = new AccountBalanceLog(data)
    await newAccountBalanceLog.save()
    return [null, newAccountBalanceLog]
  } else {
    let message = returnErrorMessage(Object.keys(requiredAccountBalanceLogSchemaObject), dataSet, requiredAccountBalanceLogSchemaDescription)
    return [message, null]
  }
}
export const returnNewBalance = (action, originalBalance, amount) => {
  switch (action) {
    case ACTION_TYPES.credit:
      return (Number.parseFloat(originalBalance) + Number.parseFloat(amount)).toString()
    case ACTION_TYPES.debit:
      return (Number.parseFloat(originalBalance) - Number.parseFloat(amount)).toString()
    default:
      return (Number.parseFloat(originalBalance)).toString()
  }
}
export const updateAccountBalance = async (data, account) => {
  let previousBalance = data['previous_balance']
  let action = data['action']
  let amount = data['amount']
  let dataSet = new Set(Object.keys(data))

  if (previousBalance !== undefined && action !== undefined && amount !== undefined) {
    let currentBalance = returnNewBalance(action, previousBalance, amount)
    data['current_balance'] = currentBalance
    data['time_stamp'] = Date.now()
    dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredAccountBalanceHistoryObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      if (!mongoose.Types.ObjectId.isValid(data['transaction_id'])) {
        return ["Invalid Transaction ID", null]
      }
      let history = [...account.history]
      history.push(data)
      account.history = [...history]
      account.balance = currentBalance
      await account.save()
      return [null, account]
    } else {
      let message = returnErrorMessage(Object.keys(requiredAccountBalanceHistoryObject), dataSet, requiredAccountBalanceHistoryDescription)
      return [message, null]
    }

  } else {
    let message = returnErrorMessage(Object.keys(requiredAccountBalanceHistoryObject), dataSet, requiredAccountBalanceHistoryDescription)
    return [message, null]
  }
}

export const validateWithdrawalAmount = (withdrawalAmt, currBalance) => {
  try {
    let withdrawalAmount = Number.parseFloat(withdrawalAmt)
    let currentBalance = Number.parseFloat(currBalance)
    if (withdrawalAmount <= currentBalance) return null
    else return `Insufficient balance, available balance is ${currentBalance.toFixed(2)}`
  } catch (error) {
    logStackTrace(error.stack)
    return "Invalid withdrawal amount"
  }
}

export const manualFetchPostedAdStats = async (_postedAds) => {
  let posts = []
  for (let postedAd of _postedAds) {
    posts.push({
      "channel_id": postedAd.channel_id._id,
      "channel_username": postedAd.channel_id.username,
      "message_id": postedAd.message_id,
      "posted_ad_id": postedAd._id
    })
  }
  let response = await fetchStats(posts)
  let keys = Object.keys(response)
  let newStats = []
  let updatedStats = []
  let createdStats = []

  for (let key of keys) {
    let _postedAdStat = await PostedAdStats.findOne({ 'posted_ad_id': key })
    if (_postedAdStat !== null) {
      let obj = {
        views: response[key],
        forwards: 0,
        views_list: [..._postedAdStat.views_list, response[key]],
        forwards_list: [..._postedAdStat.forwards_list, 0],
        recorded_at_timestamps: [..._postedAdStat.recorded_at_timestamps, Date.now()]
      }
      let id = _postedAdStat._id
      const updatedPostedAdStat = await PostedAdStats.findByIdAndUpdate(id, { ...obj, id }, { new: true })
      updatedStats.push(updatedPostedAdStat)
    }
    else {
      newStats.push({
        views: response[key],
        forwards: 0,
        views_list: [response[key]],
        forwards_list: [0],
        recorded_at_timestamps: [Date.now()],
        posted_ad_id: key
      })
    }
  }
  if (newStats.length > 0) {
    const insertedList = await PostedAdStats.insertMany(newStats)
    createdStats = insertedList
  }
  return [...updatedStats, ...createdStats]
}

export const fetchPostedAdStats = async (isActiveOnly) => {
  const _postedAds = await PostedAd.find().sort({ createdAt: -1 }).populate('channel_id').populate({
    path: 'post_creative_id',
    model: 'PostCreative',
    select: ' _id, name',
    populate: {
      path: 'campaign_id',
      model: 'Campaign',
      select: '_id, name, status',
    }
  })


  let posts = []
  for (let postedAd of _postedAds) {
    if (isActiveOnly) {
      if (postedAd.post_creative_id.campaign_id !== null && postedAd.post_creative_id.campaign_id.status === 'active') {
        posts.push({
          "channel_id": postedAd.channel_id._id,
          "channel_username": postedAd.channel_id.username,
          "message_id": postedAd.message_id,
          "posted_ad_id": postedAd._id
        })
      }
    } else {
      posts.push({
        "channel_id": postedAd.channel_id._id,
        "channel_username": postedAd.channel_id.username,
        "message_id": postedAd.message_id,
        "posted_ad_id": postedAd._id
      })
    }

  }

  let response = await fetchStats(posts)
  let keys = Object.keys(response)
  let newStats = []
  let updatedStats = []
  let createdStats = []

  for (let key of keys) {
    let _postedAdStat = await PostedAdStats.findOne({ 'posted_ad_id': key })
    if (_postedAdStat !== null) {
      let obj = {
        views: response[key],
        forwards: 0,
        views_list: [..._postedAdStat.views_list, response[key]],
        forwards_list: [..._postedAdStat.forwards_list, 0],
        recorded_at_timestamps: [..._postedAdStat.recorded_at_timestamps, Date.now()]
      }
      let id = _postedAdStat._id
      const updatedPostedAdStat = await PostedAdStats.findByIdAndUpdate(id, { ...obj, id }, { new: true })
      updatedStats.push(updatedPostedAdStat)
    }
    else {
      newStats.push({
        views: response[key],
        forwards: 0,
        views_list: [response[key]],
        forwards_list: [0],
        recorded_at_timestamps: [Date.now()],
        posted_ad_id: key
      })
    }
  }
  if (newStats.length > 0) {
    const insertedList = await PostedAdStats.insertMany(newStats)
    createdStats = insertedList
  }
  return [...updatedStats, ...createdStats]
}


export const createOrGetPostedAdForIndividual = async (data) => {
  const now = moment.tz(Date.now(), 'Africa/Addis_Ababa').format('YYYY-MM-DD')

  const today = Date(`${now} GMT`);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tmw = moment.tz(tomorrow, 'Africa/Addis_Ababa').format('YYYY-MM-DD')

  let message_id = -1
  let _postedAdForIndividual = null
  let _postedAdForIndividualCount = await PostedAdForIndividual.count({
    channel_id: data.channel_id,
    createdAt: { $gte: now, $lt: tmw },
    post_creative_id: data.post_creative_id
  })
  if (_postedAdForIndividualCount !== 0) {
    _postedAdForIndividual = await PostedAdForIndividual.find({
      channel_id: data.channel_id,
      post_creative_id: data.post_creative_id
    }).sort({ createdAt: -1 })
    _postedAdForIndividual = _postedAdForIndividual[0]
    if (_postedAdForIndividual !== null && _postedAdForIndividual !== undefined) {
      if (_postedAdForIndividual.message_id < 0) {
        message_id = _postedAdForIndividual.message_id - 1
      }
    }
  } else {
    data.message_id = message_id
    _postedAdForIndividual = new PostedAdForIndividual(data)
    await _postedAdForIndividual.save()
  }
  return _postedAdForIndividual

}

export const addReactionToIndividualPost = async (postedAdForIndividual, reaction) => {
  if (Object.keys(REACTION_TYPES).includes(reaction.toString().toUpperCase())) {
    let reactions = [...postedAdForIndividual.reactions, {
      "action": reaction.toString().toUpperCase(),
      "timestamp": Date.now()
    }]
    postedAdForIndividual.reactions = [...reactions]
    await postedAdForIndividual.save()
  }
}

export const addReactionToPost = async (postedAd, reaction, source) => {
  if (Object.keys(REACTION_TYPES).includes(reaction.toString().toUpperCase())) {
    let isDuplicate = false
    postedAd.reactions.map((r) => {
      if (`${reaction}_${source}` === r['source']) {
        isDuplicate = true
      }
    })

    if (!isDuplicate) {
      let reactions = [...postedAd.reactions, {
        "action": reaction.toString().toUpperCase(),
        "timestamp": Date.now(),
        "source": `${reaction}_${source}`
      }]
      postedAd.reactions = [...reactions]
      await postedAd.save()
    }
  }
}

export const getIndicatorAndValueFromView = (view) => {
  for (let i = 0; i < VIEW_INDICATORS.length; i++) {
    if (view.toString().includes(VIEW_INDICATORS[i])) {
      let length = (i + 1) * 3
      let zeros = Array.from({ length }, (_, index) => `0`)
      let value = `1${zeros.join('')}`
      return [VIEW_INDICATORS[i], value]
    }
  }
  return [null, 1]
}

const generateRandom = (value) => {
  if (parseInt(value) > 1000) {
    return "+"
  }
  let max = parseInt(value) - 1
  let min = parseInt(value) / 100
  return Math.floor(Math.random() * (max - min) + min);
}

export const replaceValuesFromView = (view) => {
  let [indicator, value] = getIndicatorAndValueFromView(view)
  if (indicator !== null) {
    let viewNumber = parseFloat(`${view.toString().split(indicator)[0]}${generateRandom(value)}`)
    // let viewNumber = parseFloat(`${view.toString().split(indicator)[0]}5`)
    return (parseInt(viewNumber * parseInt(value))).toString()
  }
  return view
}




export const calculateTotalCampaignView = async (campaign_id) => {
  let _creatives = await PostCreative.find({
    "campaign_id": campaign_id
  })
  let totalViews = 0
  for (let i = 0; i < _creatives.length; i++) {
    let _creativePostedAds = await PostedAd.find({
      "post_creative_id": _creatives[i]._id
    })
    for (let j = 0; j < _creativePostedAds.length; j++) {
      let _stat = await PostedAdStats.find({
        "posted_ad_id": _creativePostedAds[j]._id
      })
      for (let k = 0; k < _stat.length; k++) {
        // console.log(_stat[k].views)
        totalViews += parseInt(_stat[k].views)
      }
    }
  }
  return totalViews
}

export const calculateTotalCampaignIndividualView = async (campaign_id) => {
  let _creatives = await PostCreative.find({
    "campaign_id": campaign_id
  })
  let totalViews = 0
  for (let i = 0; i < _creatives.length; i++) {
    let count = await PostedAdForIndividual.count({ 'post_creative_id': _creatives[i]._id })
    totalViews += count
  }
  return totalViews
}

export const calculateRecentAverageView = async (channel_id) => {
  const _channelLastXPostStat = await ChannelLastXNumberOfPostStat.findOne({ 'channel_id': channel_id })
  if (_channelLastXPostStat !== null) {
    let last_post_count = parseInt(_channelLastXPostStat.last_post_count)
    let views = _channelLastXPostStat.post_count_list.slice(-last_post_count)
    const sumViewCount = views.reduce((accumulator, currentItem) => {
      // Convert 'view_count' to a number before adding
      const viewCount = parseInt(currentItem.view_count);

      return accumulator + viewCount;
    }, 0);
    return parseInt(sumViewCount / last_post_count)
  } else {
    return 0
  }
}


export const updateNumberOfSubscribers = async (isActiveOnly = false) => {
  let _channels = await Channel.find({ 'is_individual': false })
  if (isActiveOnly) {
    _channels = await Channel.find({ 'is_active': true, 'is_individual': false })
  }
  let data = {
    "channels": _channels.map((channel) => {
      return {
        "id": channel._id,
        "channel_id": channel.id
      }
    })
  }
  const response = await sendToAdMasterService(data, 'get_subscriber_count')

  if (response[1] !== null) {
    for (let result of response[1]) {
      let success = result['success']
      if (success) {
        const _channel = await Channel.findById(result['_id'])
        if (_channel !== null) {
          let prev_number_of_subscribers_data = _channel.number_of_subscribers_data !== undefined ? [..._channel.number_of_subscribers_data] : []
          let number_of_subscribers_data = [...prev_number_of_subscribers_data, {
            "number_of_subscribers": result['number_of_subscribers'],
            "timestamp": Date.now()
          }]
          _channel.number_of_subscribers_data = [...number_of_subscribers_data]
          _channel.number_of_subscribers = result['number_of_subscribers']
          await _channel.save()
        } else {
          logger.error(`Channel not found for ${result['_id']}`)
        }
      } else {
        logger.error(`${result['error']}: ${result['_id']}`)
      }
    }
  }
  else {
    logger.error(response[0])
  }

}


export const cleanRawFetchedChannelMessages = (messages) => {
  try {
    const urlRegex = /background-image:\s*url\(['"](?:&quot;)?([^'"]+)(?:&quot;)?['"]\);/g;

    let excludedMessageIDs = []
    let cleanedJSON = []

    let rawData = messages
    for (const data in rawData) {
      let obj = rawData[data]
      if (!excludedMessageIDs.includes(obj['message_id'])) {
        let image_html_cleaned = obj['image_html'].toString().replace(/&quot;/g, '"')

        let match;
        const image_urls = []

        while ((match = urlRegex.exec(image_html_cleaned)) !== null) {
          image_urls.push(match[1]);
        }

        let id = obj['message_id']
        for (let i = 0; i < image_urls.length - 1; i++) {
          id += 1
          excludedMessageIDs.push(id)
        }

        let message_cleaned = obj['message_content'].toString().replace(/<[^>]*>/g, '')

        cleanedJSON.push({
          "channel_username": obj['channel_username'],
          "message_id": obj['message_id'],
          "channel_id": obj['channel_id'],
          "message_link": obj['message_link'],
          "recent_view": obj['views'],
          "message_content": message_cleaned,
          "date": obj['date'],
          "image_url": image_urls
        })
      }
    }
    return cleanedJSON

  } catch (err) {
    logger.error('Extraction error:', err);
    return cleanedJSON
  }
}
/**?
 *  {
    "channel_username": "tikvahethiopia",
    "channel_id": "64b68b63a1cda2d8acf9bb47",
    "message_id": 82932,
    "message_link": "https://t.me/tikvahethiopia/82932",
    "views": "230737",
    "message_content": "#Updateከአንድ ቀን አድማ በኋላ በከፊል ጀምሮ የነበረው የመቐለ የታክሲ አገልግሎት መልሶ ተቋርጠዋል።የታክሲ አገልግሎቱ ህዳር 3 ሙሉ በሙሉ መቋረጡን የተናገሩት ተገልጋዮች ህዳር 4/2016 ዓ.ም ከሰአት በኃላ በከፊል የጀመረ ቢሆንም ፤ ከህዳር 5 ጀምሮ መልሶ በመቋረጡ ለከፍተኛ እንግልት መዳረጋቸው ይገልፃሉ።ስለ አገልግሎቱ መቋረጥ የታክሲ ማህበራት አቤቱታ ሲያቀርቡ ፤መንግስት ደግሞ ለሚድያ&nbsp;መግለጫ ሰጥቷል ቲክቫህ ኢትዮጵያ የመቐለ ቤተሰብ አቤቱታውና መግለጫው ተመልክቶታል።ህዳር 05/2016 አምስት የመቐለ የታክሲ ማህበራት በጋራ ለመንግስት ያቀረቡት የፅሁፍ አቤቱታ እንደሚያመለክተው። \"ስራ የማቆም አድማው ከእወቅናችን ውጭ የተደረገ ኢ-ህጋዊ ተግባር ቢሆንም ያለውን የኑሮና የመለዋወጫ እቃ ውድነትና ግምት ውስጥ&nbsp; ያስገባ የታሪፍ ማስተካከያ ተደርጎ አገልግሎቱ እንዲቀጥል እንጠይቃለን \"&nbsp; ይላል።የክልሉ መንግስት በትራንስፓርትና መገናኛ ቢሮ በኩል ለሚድያ በሰጠው መግለጫ ፤ \" በተቀመጠው የታሪፍ መመሪያ መሰረት ትርፍ መጫንና ያልተፈቀደ ታሪፍ ማስከፈል ህጋዊ አይደለም ፍፁም የተከለከለ ነው ፤ ስለዚህ ይህንን በመቀበል አገልግሎቱ መቀጠል ይገባል \" ብሏል።ቢሮው አያይዞ በአገልግሎት የማቆም አድማው የተሳተፈ የታክሲ ባለቤትና አሽከርካሪ እያንዳንዱ ብር 1200 እየተቀጣ እንዲመለስ ያሳሰበ ሲሆን የተቀመጠው ቅጣት የማይተገብሩ ታክሲዎች የሰሌዳ ቁጥራቸው እየተፈታ አገልግሎት ከመስጠት እየተከለከሉ እንደሆነ የቲክቫህ ኢትዮጵያ የመቐለ ቤተሰብ አባል አረጋግጠዋል።የትግራይ የትራንስፓርትና መገናኛ ቢሮ ህዳር 3/2016 ዓ.ም ለሚድያ በሰጠው መግለጫ ፤ የታክሲ ባለቤቶችና አሽከርካሪዎች አገልግሎት የማቋረጥና አድማ የመምታት ደርጊቱ ችላ ተብሎ የማይታለፍ ህጋዊ እርምጃና ተጠያቂነት የሚያስከትል መሆኑን በመገንዘብ ስራቸው ይቀጥሉ ዘንድ መምከሩ ፤ የመንግስት ምክርና ማሳሰብያ ችላ ብሎ በአድማ የሚቀጥል ባለንብረትና አሽከርካሪ ግን ጥብቅ እርምጃ ይወሰድበታል ሲል ማስጠንቀቁን ቲክቫህ ኢትዮጵያ የመቐለ ቤተሰብ አባል መዘገቡ ይታወሳል&nbsp;@tikvahethiopia",
    "date": "Nov 16 at 12:48",
    "image_url": [
      "https://cdn4.cdn-telegram.org/file/kcA9ryaMqtnRvsw2LaVCZx18FWlSnT3YU3P1E-iByGjMVcsmU409bH4NSSlsiX9_R6OQFXLkqLCXFpmKzkmmutmIu0J1Scm9qYfvjsOuZIVF2QcM-1akJfJe2-q9SGfXRYXPu6ythiIiGHza7-rMNWP_rKaCRgZ-TYZ4uAE3uKm5_5d0jZywClQWr1uEw6YxE7D3hMSsJvmgY_yktm5SsRTDuVbOT819VVjn5L16WblT9gRgwm4ZrWcAi7ziVC8IGO6cEcK0E06TKfQ2svTUcpXqfG_wFe3Quqc9-VS6q_pjIeCUe360_xC_RDARKkz6lI2nkS3kMjQDQ8ZbX85trw.jpg",
      "https://cdn4.cdn-telegram.org/file/UsErqWFcXCSmJpizLFD945mgNcJ1q4S8jeDK39n7Ai71HGIZ0s9BsEBWsS40OmjngeME2Uc_1MhqQ-LwcljMgJ402xIDPvv0memeQmueGrCIrTgWi2t6INSEyKkl81Xq9Gee9P2ES8RAeWl-VSOFoVKpVt2QomZMnQ4Mw-JFLkW6LSIzehwNUAW6Peeyiav9J_iZ3Iu-8FoQK-Md09zIY9VKLtExR87BPp-8At1dxlNnkUcsDWps_8mrF4CyiftIavloWOdZFPkW21OXbAi20q6HRZ5CqgoxEJCQxCBZ3W5Vo--NWC2zGtrxvKhYV8_rCf4y2RQlluWUz-RaXtoB8Q.jpg",
      "https://cdn4.cdn-telegram.org/file/VmKa87vfv6BYF_vp6nz2OVCFk0LwSoR5ypbWPMAPcTbeOaKcx4T4rja8mpyGzxaVV_9eQAnsujC4RBP0PbeW7n-kA4OgSLA9bdPjocVjywoMiWZhws1N974-V2CZul5PX6fQJEpKqUczo0_208ASBtMXH-46aiXeNJNrMyXsbxQ3L7VVQEnfVowKxvOR2dLaK8sWMD3pXPBKsbokhTOUHTAzDIQx4StEJx2nkybXRhWG2PMBQIdFRzEsxcA-RieFTtX_pW4wo2CtofoIVbkQOid1c8-V9Y-HMZy7gQofnMShBidnIE80r4wQd49ra21AqUmunsaNb6Qyi8aYvyizaw.jpg"
    ]
  }
 */
export const createOrUpdateChannelMessageView = async (messages) => {
  for (let message of messages) {
    let _channelMessage = await ChannelMessage.findOne({ 'channel_id': message['channel_id'], 'message_id': message['message_id'] })
    if (_channelMessage === null) {
      let newChannelMessage = new ChannelMessage(message)
      await newChannelMessage.save()

      let newChannelMessageStat = new ChannelMessageStat({
        "channel_message_id": newChannelMessage._id,
        "recent_view": message['recent_view'],
        "view_records": [
          {
            "view": message['recent_view'],
            "timestamp": Date.now()
          }
        ]
      })

      await newChannelMessageStat.save()
    }
    else {
      _channelMessage.recent_view = message['recent_view']
      await _channelMessage.save()
      let _channelMessageStat = await ChannelMessageStat.findOne({ 'channel_message_id': _channelMessage._id })
      if (_channelMessageStat !== null) {
        _channelMessageStat.recent_view = message['recent_view']
        let view_record = [..._channelMessageStat.view_records, {
          "view": message['recent_view'],
          "timestamp": Date.now()
        }]
        _channelMessageStat.view_records = [...view_record]
        await _channelMessageStat.save()

      } else {
        let newChannelMessageStat = new ChannelMessageStat({
          "channel_message_id": _channelMessage._id,
          "recent_view": message['recent_view'],
          "view_records": [
            {
              "view": message['recent_view'],
              "timestamp": Date.now()
            }
          ]
        })

        await newChannelMessageStat.save()
      }
    }
  }
  let _channel = await Channel.findById(messages[0]['channel_id'])
  if (_channel !== null) {
    await updateChannelRecentAverageView(_channel)
  }
}


export const updateChannelRecentAverageView = async (channel) => {
  let _channeMessages = await ChannelMessage.find({ 'channel_id': channel._id })
  let sum = _channeMessages.slice(-LAST_POST_COUNT).reduce((accumulator, currentItem) => {
    const viewCount = parseInt(currentItem.recent_view)
    return accumulator + viewCount
  }, 0)
  // console.log('channel._id', channel._id)
  // console.log('_channeMessages', _channeMessages)
  // console.log('sum', sum)
  let total_values = _channeMessages.slice(-LAST_POST_COUNT).length === 0
    ? LAST_POST_COUNT : _channeMessages.slice(-LAST_POST_COUNT).length
  let avg_view = parseInt(sum / total_values)
  channel.recent_average_view = avg_view
  channel.average_view_data = [...channel.average_view_data, {
    "average_view": avg_view,
    "timestamp": Date.now()
  }]
  await channel.save()
  return avg_view
}


export const updateChannelMessageViews = async (isActiveOnly = true) => {
  let _channels = await Channel.find({ 'is_individual': false })
  if (isActiveOnly) {
    _channels = await Channel.find({ 'is_active': true, 'is_individual': false })
  }
  const now = new Date()

  for (let channel of _channels) {
    const _channelMessages = await ChannelMessage.find({ channel_id: channel._id }).sort({ createdAt: -1 })
    let lastMessageID = LAST_POST_COUNT
    let startMessageID = 1
    if (_channelMessages.length > 0) {
      let prevLastMessageID = _channelMessages[0].message_id
      let lastDate = _channelMessages[0].createdAt
      const timeDifference = now - lastDate
      const dayDifference = timeDifference / (1000 * 60 * 60 * 24)
      let postPerDay = channel.average_post_per_day
      lastMessageID = prevLastMessageID + dayDifference * postPerDay
      startMessageID = lastMessageID - LAST_POST_COUNT
    } else {
      lastMessageID += channel.average_post_per_day
    }
    await fetchChannelMessageAndSaveStats(channel._id, channel.username, startMessageID, lastMessageID)
  }
}

export const getListCategorizedWithCreative = (_list) => {
  let list = []
  /**
   * {
            "post_creative_id": "657c2214ef0125a4413a1419",
            "channel_id": "64b68b63a1cda2d8acf9bb47"
        },
        {
            "post_creative_id": "657c2209ef0125a4413a1414",
            "channel_id": "64b68b63a1cda2d8acf9bb47"
        }
   */
  for (let item of _list) {
    let index = list.findIndex((l) => l.post_creative_id === item.post_creative_id)
    if (index === -1) {
      list.push({
        "post_creative_id": item.post_creative_id,
        "channels": [item.channel_id]
      })
    } else {
      list[index].channels.push(item.channel_id)
    }
  }

  // let finalList = [];

  // for (let item in list) {
  //   let post_creative_id = list[item].post_creative_id
  //   for (let channel in list[item].channels) {
  //     finalList.push({
  //       "post_creative_id": post_creative_id,
  //       "channel_id": list[item].channels[channel]
  //     })
  //   }
  // }

  console.log(list)
  return list
}

export const getChannelPayment = (channel_tier_values) => {
  let value = "CPM(Cost per mile): 16"
  if (channel_tier_values.length === 0) return value
  value = ""
  for (let val of channel_tier_values) {
    value += `${val.name}: ${val.value} Birr <br>`
  }
  return value
}

export const getValueFromKPI = (_channel, KPI) => {

  let list = _channel.channel_tier_values
  let value = 0
  for (let tier_value of list) {
    if (tier_value.name === KPI) {
      console.log(tier_value)
      value = tier_value.value
      break
    }
  }
  return value
}

export const getChannelValuesForReport = async (_channel, _campaign, KPI) => {
  let content_data = TABLE_ROW_CONTENT_DATA
  let table_row = TABLE_ROW
  let content = ""
  let row_data = ""
  let payment = 0

  let _channelPostedAds = await PostedAd.find({ "channel_id": _channel._id }).populate({
    path: 'post_creative_id',
    populate: {
      path: 'campaign_id',
      model: 'Campaign',
      select: '_id, name',
      match: { _id: _campaign._id },

    }
  })

  let i = 1
  for (let _postedAd of _channelPostedAds) {
    if (_postedAd.post_creative_id.campaign_id === null) continue
    if (_postedAd.post_creative_id.campaign_id._id.toString() === _campaign._id.toString()) {
      let _postedAdStat = await PostedAdStats.findOne({ "posted_ad_id": _postedAd._id })

      if (_postedAdStat) {

        let createdAt = new Date(_postedAd.createdAt)
        let createdAtDate = createdAt.toLocaleDateString("en-US")
        let createdAtTime = createdAt.toLocaleTimeString('en-US')

        let viewPayment = (getValueFromKPI(_channel, KPI) / 1000) * _postedAdStat.views
        payment += parseFloat(viewPayment.toFixed(2))

        content += content_data.replace("DATA", i)
        content += content_data.replace("DATA", _postedAd.post_creative_id.name)
        content += content_data.replace("DATA", `${createdAtDate} ${createdAtTime}-GMT+3`)
        content += content_data.replace("DATA", _postedAdStat.views)
        content += content_data.replace("DATA", viewPayment.toFixed(2))

        row_data += table_row.replace("ROW", content)
        content = ""
        i += 1
      }

    }
  }
  return [payment, row_data]


}

export const prepareReport = async (campaign_id, channel_id, KPI = "CPM(Cost per mile)", save_file = false) => {
  let content = REPORT_HTML_CONTENT_FOR_CHANNEL


  // let htmlContent = REPORT_HTML_CONTENT.replace("{CONTENT}", content)

  let _campaign = await Campaign.findById(campaign_id)
  let _channel = await Channel.findById(channel_id)

  let htmlContent = readFileSync('report/report.html', 'utf8')

  htmlContent = htmlContent.replace("CHANNEL_NAME", _channel.title)
  htmlContent = htmlContent.replace("CHANNEL_TYPE", _channel.channel_tier || "Standard")
  htmlContent = htmlContent.replace("CHANNEL_PAYMENT", getChannelPayment(_channel.channel_tier_values))

  htmlContent = htmlContent.replace("CAMPAIGN_NAME", _campaign.name)


  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  let start_date_string = new Date(_campaign.campaign_start_date).toLocaleDateString(undefined, options)
  let end_date_string = new Date(_campaign.campaign_end_date).toLocaleDateString(undefined, options)

  htmlContent = htmlContent.replace("CAMPAIGN_START_DATE", start_date_string)
  htmlContent = htmlContent.replace("CAMPAIGN_END_DATE", end_date_string)


  const diffTime = Math.abs(new Date(_campaign.campaign_end_date) - new Date(_campaign.campaign_start_date));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  htmlContent = htmlContent.replace("DURATION", `${diffDays} Days`)


  // await getChannelValuesForReport(_channel, _campaign, KPI)


  let [payment, row_data] = await getChannelValuesForReport(_channel, _campaign, KPI)


  content = content.replace("ROW_DATA", row_data)
  content = content.replace("TOTAL_AMOUNT", `${parseFloat(payment).toFixed(2)} Birr`)


  htmlContent = htmlContent.replace("CONTENT", content)

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: `/usr/bin/google-chrome`,
    args: [`--no-sandbox`, `--headless`, `--disable-dev-shm-usage`]
  });
  const page = await browser.newPage();

  // Set the HTML content on the page
  await page.setContent(htmlContent);

  // Generate a PDF from the HTML content
  const pdfBuffer = await page.pdf();

  if (save_file) {
    const pdfFilePath = `report_files/${Date.now()}.pdf`;
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    await browser.close()
    return pdfFilePath
  }

  await browser.close();
  return pdfBuffer
}

export const sendReportToChannel = async (user_id, reportFile, filename, caption) => {
  const formData = new FormData();
  // const file = fs.readFileSync('generated-pdf.pdf')
  formData.append('file', reportFile, `${filename}`);
  // formData.append('user_id', user_id);
  // formData.append('caption', caption);

  await sendToPublisherManagementService(formData, `send_campaign_report`,
    { 'accept': 'application/json', 'Content-Type': 'multipart/form-data' },
    {
      'user_id': user_id,
      'caption': caption
    }
  )
}

export const get_report_object = (_postedAd, _postedAdStat, KPI) => {
  return {
    "channel_name": _postedAd.channel_id.title,
    "channel_payment": getChannelPayment(_postedAd.channel_id.channel_tier_values),
    "channel_tier": _postedAd.channel_id.channel_tier === null ? 'Standard' : _postedAd.channel_id.channel_tier,
    "creative_name": _postedAd.post_creative_id.name,
    "views": _postedAdStat.views,
    "payment": parseFloat(((getValueFromKPI(_postedAd.channel_id, KPI) / 1000) * _postedAdStat.views).toFixed(2)),
    "date": _postedAd.createdAt
  }
}

export const get_campaign_report = async (_campaign, KPI = "CPM(Cost per mile)") => {

  let report_obj = {}
  let _campaignlPostedAds = await PostedAd.find().populate({
    path: 'post_creative_id',
    populate: {
      path: 'campaign_id',
      match: { _id: String(_campaign._id) },
      model: 'Campaign',
      select: '_id, name',
    }
  }).populate('channel_id')

  for (let _postedAd of _campaignlPostedAds) {
    if (_postedAd.post_creative_id.campaign_id === null) continue
    if (_postedAd.post_creative_id.campaign_id._id.toString() === _campaign._id.toString()) {
      let _postedAdStat = await PostedAdStats.findOne({ "posted_ad_id": _postedAd._id })

      if (_postedAdStat) {
        if (Object.keys(report_obj).includes(_postedAd.channel_id._id.toString())) {
          report_obj[_postedAd.channel_id._id.toString()].push(get_report_object(_postedAd, _postedAdStat, KPI))
        } else {
          report_obj[_postedAd.channel_id._id.toString()] = [
            get_report_object(_postedAd, _postedAdStat, KPI)
          ]
        }
      }
    }
  }

  let content = ""

  for (let key in report_obj) {
    let channelContent = CHANNEL_REPORT_HTML_CONTENT_FOR_CAMPAIGN
    let total_payment = 0
    channelContent = channelContent.replace('CHANNEL_NAME', report_obj[key][0]['channel_name'])
    channelContent = channelContent.replace('CHANNEL_PAYMENT', report_obj[key][0]['channel_payment'])
    channelContent = channelContent.replace('CHANNEL_TYPE', report_obj[key][0]['channel_tier'])
    let row_data = ""
    let i = 1
    let content_data = TABLE_ROW_CONTENT_DATA
    let table_row = TABLE_ROW
    let current_channel_content = ""
    for (let channel of report_obj[key]) {
      total_payment += channel.payment

      let createdAt = new Date(channel.date)
      let createdAtDate = createdAt.toLocaleDateString("en-US")
      let createdAtTime = createdAt.toLocaleTimeString('en-US')

      current_channel_content += content_data.replace("DATA", i)
      current_channel_content += content_data.replace("DATA", channel.creative_name)
      current_channel_content += content_data.replace("DATA", `${createdAtDate} ${createdAtTime}-GMT+3`)
      current_channel_content += content_data.replace("DATA", channel.views)
      current_channel_content += content_data.replace("DATA", channel.payment.toFixed(2))

      row_data += table_row.replace("ROW", current_channel_content)
      current_channel_content = ""
      i += 1
    }

    channelContent = channelContent.replace("ROW_DATA", row_data)
    channelContent = channelContent.replace("TOTAL_AMOUNT", `${parseFloat(total_payment).toFixed(2)} Birr`)
    content += channelContent + "<br><br>"
  }

  let htmlContent = readFileSync('campaign_channel_payment_report/report.html', 'utf8')

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  let start_date_string = new Date(_campaign.campaign_start_date).toLocaleDateString(undefined, options)
  let end_date_string = new Date(_campaign.campaign_end_date).toLocaleDateString(undefined, options)

  htmlContent = htmlContent.replace("CAMPAIGN_NAME", _campaign.name)
  htmlContent = htmlContent.replace("CAMPAIGN_START_DATE", start_date_string)
  htmlContent = htmlContent.replace("CAMPAIGN_END_DATE", end_date_string)

  const diffTime = Math.abs(new Date(_campaign.campaign_end_date) - new Date(_campaign.campaign_start_date));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  htmlContent = htmlContent.replace("DURATION", `${diffDays} Days`)

  htmlContent = htmlContent.replace("COMPANY_NAME", _campaign.company_id.name)
  htmlContent = htmlContent.replace("CONTENT", content)

  writeFileSync('campaign_channel_payment_report/report1.html', htmlContent)

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: `/usr/bin/google-chrome`,
    args: [`--no-sandbox`, `--headless`, `--disable-dev-shm-usage`]
  });
  const page = await browser.newPage();

  // Set the HTML content on the page
  await page.setContent(htmlContent);

  // Generate a PDF from the HTML content
  const pdfBuffer = await page.pdf();

  await browser.close();
  return pdfBuffer

}


export const getCampaignChannels = async (_campaign) => {
  let _campaignlPostedAds = await PostedAd.find().populate({
    path: 'post_creative_id',
    populate: {
      path: 'campaign_id',
      match: { _id: String(_campaign._id) },
      model: 'Campaign',
      select: '_id, name',
    }
  }).populate('channel_id')

  let channels = []

  for (let _postedAd of _campaignlPostedAds) {
    if (_postedAd.post_creative_id.campaign_id === null) continue
    if (_postedAd.post_creative_id.campaign_id._id.toString() === _campaign._id.toString()) {
      if (!channels.includes(_postedAd.channel_id._id.toString())) {
        channels.push(_postedAd.channel_id._id.toString())
      }
    }
  }

  return channels
}




