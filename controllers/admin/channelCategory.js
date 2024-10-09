import mongoose from "mongoose"
import { ChannelCategory, requiredChannelCategorySchemaObject as SchemaObject, channelCategorySchemaObjectDescription as SchemaDescription } from "../../models/admin/channelCategory.js"
import { checkIntersection, returnErrorMessage, logStackTrace } from "../util.js"
import logger from "../../logger/logger.js"
import asyncHandler from "express-async-handler"

// @desc    Get channel categories
// @route   GET /admin/channel_categories
// @access  Private
export const getChannelCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await ChannelCategory.find()
    res.status(200).json(categories)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create channel category
// @route   POST /admin/channel_categories
// @access  Private
export const createChannelCategory = asyncHandler(async (req, res) => {
  try {
    const channelCategoryData = req.body
    const channelCategorySet = new Set(Object.keys(channelCategoryData))
    const schemaSet = new Set(Object.keys(SchemaObject))
    const intersection = checkIntersection(schemaSet, channelCategorySet)
    if ([...intersection].length == [...schemaSet].length) {
      const _channelCategory = ChannelCategory.findOne({ 'category_key': channelCategoryData.category_key })
      if (_channelCategory !== null) {
        const newChannelCategory = new ChannelCategory(channelCategoryData)
        await newChannelCategory.save()
        res.status(201).json(newChannelCategory)
      } else {
        logger.error(`Channel category already exist with the same category_key: ${channelCategoryData.category_key}`)
        res.status(400).send(`Channel category already exist with the same category_key: ${channelCategoryData.category_key}`)
      }
    }
    else {
      let message = returnErrorMessage(Object.keys(SchemaObject), channelCategorySet, SchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Update channel category
// @route   PATCH /admin/channel_categories/:id mongodb ObjectID
// @access  Private
export const updateChannelCategory = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send("No channel with this ID")
      const updatedChannelCategory = await ChannelCategory.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
      res.status(200).json(updatedChannelCategory)
    } else {
      logger.error("Channel category ID(_id) is required.")
      res.status(400).send("Channel category ID(_id) is required.")
    }
  }
  catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    create channel categories from list
// @route   PATCH /admin/channel_categories/create_from_list
// @access  Private
export const createChannelCategoryFromList = asyncHandler(async (req, res) => {
  try {
    const channelCategoryData = req.body
    const channelCategoryDataList = channelCategoryData.category_list
    // console.log(channelCategoryDataList)
    // console.log(typeof (channelCategoryDataList))
    if (channelCategoryDataList !== undefined && channelCategoryDataList.length > 0) {
      // TODO: implement this feature
      let categoryObjectsList = []
      for(let i =0; i< channelCategoryDataList.length;i++){
        let key = channelCategoryDataList[i].toString().toLowerCase().split(' ')
        let _channelCategory = await ChannelCategory.findOne({"category_key": key.join('_')})
        if(_channelCategory === null){
          categoryObjectsList.push({
            "category_key": key.join('_'),
            "category_value": channelCategoryDataList[i]
          })
        }
      }
      let newChannelCategories = await ChannelCategory.insertMany(categoryObjectsList);
      res.json(newChannelCategories)
    } else {
      logger.error("List of channel categories required(category_list)")
      res.status(400).send("List of channel categories required(category_list)")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

