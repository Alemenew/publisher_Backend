import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js";
import { checkIntersection, logStackTrace, returnErrorMessage, validateBodyForConversionCreative } from "../util.js";
import ConversionCreative, { conversionCreativeSchemaDescription, requiredConversionCreativeSchemaObject } from "../../models/postCreatives/conversionCreative.js";
import PostCreative from "../../models/postCreatives/postCreatives.js";


// @desc    Create PostCreatives
// @route   POST /post_creatives/conversion_creative
// @access  Private
export const createConversionCreative = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredConversionCreativeSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length == [...schemaSet].length) {
      data.image_urls = Array.from(new Set(data.image_urls))
      data.video_urls = Array.from(new Set(data.video_urls))
      data.button_list = Array.from(new Set(data.button_list))

      if (!Array.isArray(data.main_creatives_list)) return res.status(400).send("Main creative list(main_creatives_list) must be an array.")

      if (data.main_creatives_list.length === 0) return res.status(400).send("Main creative list(main_creatives_list) must not be empty.")

      for (let creative of data.main_creatives_list) {
        if (!mongoose.Types.ObjectId.isValid(creative)) return res.status(404).send(`No creative with ID ${creative}`)
        const _creative = await PostCreative.findById(creative)
        if (_creative === null) return res.status(404).send(`No creative with ID ${creative}`)
      }

      const newConversionCreative = new ConversionCreative(data)
      await newConversionCreative.save()
      res.json(newConversionCreative)
    } else {
      let message = returnErrorMessage(Object.keys(requiredConversionCreativeSchemaObject), dataSet, conversionCreativeSchemaDescription)
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update ConversionCreative
// @route   PATCH /post_creatives/conversion_creative/:id mongodb ObjectID
// @access  Private
export const updateConversionCreative = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("No post creative with this ID");
      return res.status(404).send("No post creative with this ID")
    }
    let _postCreative = await ConversionCreative.findById(_id)
    if (_postCreative !== null) {
      let isValid = await validateBodyForConversionCreative(data, _postCreative._id)
      if (isValid === null) {
        data.is_edited = true
        const updatedPostCreative = await ConversionCreative.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
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

// @desc    Get  ConversionCreatives
// @route   GET /post_creatives/conversion_creative/:id
// @access  Private
export const getConversionCreative = asyncHandler(async (req, res) => {
  try {
    const { id: creative_id } = req.params
    if (creative_id) {
      if (!mongoose.Types.ObjectId.isValid(creative_id)) {
        logger.error("No post creative with that ID")
        return res.status(404).send('No post creative with that ID')
      }
      const _postCreative = await ConversionCreative.findById(creative_id).populate({
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


// @desc    Get All ConversionCreatives
// @route   GET /post_creatives/conversion_creatives
// @access  Private
export const getAllConversionCreatives = asyncHandler(async (req, res) => {
  try {
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

    res.json(conversionCreatives)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

