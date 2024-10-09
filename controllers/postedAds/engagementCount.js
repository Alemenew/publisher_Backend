import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import EngagementCount, { engagementCountSchemaDescription, requiredEngagementCountSchemaObject } from "../../models/postedAds/engagementCount.js"
import PostedAd from "../../models/postedAds/postedAds.js"
import mongoose from "mongoose"


// @desc    Create PostedAd EngagementCount
// @route   POST /posted_ads/engagement_count/posted_ad
// @access  Private
export const createPostedAdEngagement = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredEngagementCountSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      if (!mongoose.Types.ObjectId.isValid(data.posted_ad_id)) {
        logger.error("No posted Ad with this ID");
        return res.status(400).send("No posted Ad with this ID")
      }
      const _postedAd = await PostedAd.findById(data.posted_ad_id)
      if (_postedAd !== null) {
        const _engagementCount = await EngagementCount.findOne({ 'posted_ad_id': data.posted_ad_id })
        if (_engagementCount === null) {
          data.count = 1
          data.req_body = [data.req_body]
          data.engaged_at_list = [Date.now()]
          const newEngagementCount = new EngagementCount(data)
          await newEngagementCount.save()
          res.status(201).json(newEngagementCount)
        } else {
          data.count = _engagementCount.count + 1
          data.req_body = [..._engagementCount.req_body, data.req_body]
          data.engaged_at_list = [..._engagementCount.engaged_at_list, Date.now()]
          let id = _engagementCount._id
          const updatedEngagementCount = await EngagementCount.findByIdAndUpdate(id, { ...data, id }, { new: true })
          res.json(updatedEngagementCount)
        }
      } else {
        logger.error(`No posted Ad found under the ID '${data.posted_ad_id}'`)
        res.status(400).send(`No posted Ad found under the ID '${data.posted_ad_id}'`)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredEngagementCountSchemaObject), dataSet, engagementCountSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }


  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get PostedAd EngagementCount
// @route   GET /posted_ads/engagement_count/posted_ad/:id->posted_ad_id mongodb ObjectID
// @access  Private
export const getPostedAdEngagementCount = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("No posted Ad with this ID");
        return res.status(400).send("No posted Ad with this ID")
      }
      const _engagementCount = await EngagementCount.findOne({ 'posted_ad_id': _id })
      if (_engagementCount !== null) {
        res.json(_engagementCount)
      } else {
        logger.error(`No Engagement count for the posted AD ID: '${_id}'`)
        res.status(400).send(`No Engagement count for the posted AD ID: '${_id}'`)
      }
    } else {
      logger.error("Posted Ad ID is required")
      res.status(400).send("Posted Ad ID is required")
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get All PostedAd EngagementCounts
// @route   GET /posted_ads/engagement_count
// @access  Private
export const getAllEngagementCount = asyncHandler(async (req, res) => {
  try {
    const engagementCounts = await EngagementCount.find()
    res.json(engagementCounts)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


