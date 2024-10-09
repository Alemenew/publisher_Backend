import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js";
import { checkIntersection, logStackTrace, returnErrorMessage, validateBodyForPostCreative } from "../util.js";
import PostCreative, { postCreativeSchemaDescription, requiredPostCreativeSchemaObject } from "../../models/postCreatives/postCreatives.js";
import Campaign from "../../models/campaigns/campaigns.js";
import StagedPostCreative from "../../models/postCreatives/stagedPostCreatives.js";



// @desc    Create PostCreatives
// @route   POST /post_creatives
// @access  Private
export const createPostCreative = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredPostCreativeSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length == [...schemaSet].length) {
      let isValid = await validateBodyForPostCreative(data, null)
      if (isValid === null) {
        data.image_urls = Array.from(new Set(data.image_urls))
        data.video_urls = Array.from(new Set(data.video_urls))
        data.button_list = Array.from(new Set(data.button_list))

        const newPostCreative = new PostCreative(data)
        await newPostCreative.save()
        res.json(newPostCreative)
      } else {
        logger.error(isValid);
        res.status(400).send(isValid)
      }
    }
    else {
      let message = returnErrorMessage(Object.keys(requiredPostCreativeSchemaObject), dataSet, postCreativeSchemaDescription)
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Update PostCreative
// @route   PATCH /post_creatives/:id mongodb ObjectID
// @access  Private
export const updatePostCreative = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No post creative with this ID");
      return res.status(404).send("No post creative with this ID")
    }
    let _postCreative = await PostCreative.findById(_id)
    if (_postCreative !== null) {
      let isValid = await validateBodyForPostCreative(data, _postCreative._id)
      if (isValid === null) {
        data.is_edited = true
        const updatedPostCreative = await PostCreative.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
        res.json(updatedPostCreative)
      } else {
        logger.error(isValid);
        res.status(400).send(isValid)
      }
    } else {
      logger.error(`No post creative found under ID '${_id}'`);
      res.status(400).send(`No post creative found under ID '${_id}'`)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get PostCreative
// @route   GET /post_creatives/:id
// @access  Private
export const getPostCreative = asyncHandler(async (req, res) => {
  try {
    const { id: creative_id } = req.params
    if (creative_id) {
      if (!mongoose.Types.ObjectId.isValid(creative_id)) {
        logger.error("No post creative with that ID")
        return res.status(404).send('No post creative with that ID')
      }
      const _postCreative = await PostCreative.findById(creative_id).populate({
        path: 'campaign_id',
        model: 'Campaign',
        select: 'company_id, _id, name',
        populate: {
          path: 'company_id',
          model: 'Company'
        }
      })
      if (_postCreative !== null) {
        res.json(_postCreative)
      } else {
        logger.error("No post creative with that ID")
        return res.status(404).send('No post creative with that ID')
      }
    } else {
      logger.error("postCreativeID(creative_id) is required.")
      return res.status(404).send('postCreativeID(creative_id) is required.')
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get All PostCreatives
// @route   GET /post_creatives
// @access  Private
export const getAllPostCreatives = asyncHandler(async (req, res) => {
  try {
    const postCreatives = await PostCreative.find().sort({ createdAt: -1 }).populate({
      path: 'campaign_id',
      model: 'Campaign',
      select: 'company_id, _id, name',
      populate: {
        path: 'company_id',
        model: 'Company'
      }
    })
    let _postCreatives = []
    for (let postCreative of postCreatives) {
      let _stagedPostCreative = await StagedPostCreative.count({ "post_creative_id": postCreative._id })
      // let categoriesList = postCreative.campaign_id.channel_categories_list
      _postCreatives.push({ ...postCreative._doc, staged: _stagedPostCreative > 0 ? "staged" : "not staged" })
    }
    res.json(_postCreatives)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})



// @desc    Get Campaign PostCreatives
// @route   GET /post_creative/campaign_post_creative/:id campaign_id -> mongodb ObjectID
// @access  Private
export const getCampaignPostCreatives = asyncHandler(async (req, res) => {
  try {
    const { id: campaign_id } = req.params
    if (campaign_id) {
      if (!mongoose.Types.ObjectId.isValid(campaign_id)) {
        logger.error("No campaign with that ID")
        return res.status(404).send('No campaign with that ID')
      }
      const campaign_post_creatives = await PostCreative.find({ 'campaign_id': campaign_id }).populate()
      res.json(campaign_post_creatives)
    } else {
      logger.error("campaignID(campaign_id) is required.")
      return res.status(404).send('campaignID(campaign_id) is required.')
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

