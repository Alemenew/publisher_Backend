import mongoose from "mongoose"
import { checkIntersection, logStackTrace, returnErrorMessage, validateBodyForPostedAds } from "../util.js"
import logger from "../../logger/logger.js"
import asyncHandler from "express-async-handler"
import PostedAd, { postedAdSchemaDescription, requiredPostedAdSchemaObject } from "../../models/postedAds/postedAds.js"
import Channel from "../../models/channel.js"
import PostCreative from "../../models/postCreatives/postCreatives.js"
import Campaign from "../../models/campaigns/campaigns.js"



// @desc    Get postedAds
// @route   GET /postedAs
// @access  Private
export const getPostedAs = asyncHandler(async (req, res) => {
  try {
    const postedAs = await PostedAd.find().sort({ createdAt: -1 }).populate({
      path: 'post_creative_id',
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
    res.status(200).json(postedAs)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create postedAds
// @route   POST /posted_ads
// @access  Private
export const createPostedAd = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredPostedAdSchemaObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      const isValid = await validateBodyForPostedAds(data)
      if (isValid[0] === null) {
        data.channel_id = isValid[1]._id
        const newPost = new PostedAd(data)
        await newPost.save()
        res.status(201).json(newPost)
      } else {
        logger.error(isValid[0])
        res.status(400).send(isValid[0])
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredPostedAdSchemaObject), dataSet, postedAdSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update post
// @route   PATCH /posted_ads
// @access  Private
export const updatePostedAd = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const postData = req.body
    if (_id !== undefined) {
      const isValid = await validateBodyForPostedAds(postData)
      if (isValid[0] === null) {
        if (isValid[1] !== undefined) [
          postData.channel_id = isValid[1]._id
        ]
        const updatedPost = await PostedAd.findByIdAndUpdate(_id, { ...postData, _id }, { new: true })
        if (updatedPost !== null) {
          res.status(200).json(updatedPost)
        } else {
          logger.error("Posted ad not found")
          res.status(400).send("Posted ad not found")
        }
      }
      else {
        logger.error(isValid[0])
        res.status(400).send(isValid[0])
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

// @desc    Get post with creativeID
// @route   PATCH /posted_ads/get_posted_ad_with_creative_id
// @access  Private
export const getPostedAdWithCreativeID = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const post_creative_id = data.post_creative_id
    if (post_creative_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(post_creative_id)) {
        logger.error("No post creative with this ID");
        return res.status(400).send("No post creative with this ID")
      }
      const _postedAds = await PostedAd.find({ post_creative_id: post_creative_id })
      res.json(_postedAds)
    } else {
      logger.error("post_creative_id is required")
      res.status(400).send("post_creative_id is required")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Ad posts on channel
// @route   PATCH /posts/get_channel_post
// @access  Private
export const getChannelPostedAds = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const channel_id = data.channel_id
    if (channel_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(channel_id)) {
        logger.error("No channel with this ID");
        return res.status(400).send("No channel with this ID")
      }
      const _postedAds = await PostedAd.find({ channel_id: channel_id })
      res.json(_postedAds)
    } else {
      logger.error("channel_id is required")
      res.status(400).send("channel_id is required")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


