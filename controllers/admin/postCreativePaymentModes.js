import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import PostCreativePaymentMode, { requiredPostCreativePaymentModeSchemaDescription, requiredPostCreativePaymentModeSchemaObject } from "../../models/admin/postCreativePaymentModes.js"

// @desc    Get Post Creative Payment Modes
// @route   GET /admin/post_creative_payment_mode
// @access  Private
export const getPostCreativePaymentModes = asyncHandler(async (req, res) => {
  try {
    const postCreativeModes = await PostCreativePaymentMode.find()
    res.json(postCreativeModes)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create Post Creative Payment Mode
// @route   POST /admin/post_creative_payment_mode
// @access  Private
export const createPostCreativePaymentModes = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredPostCreativePaymentModeSchemaObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      const _postCreativePaymentMode = await PostCreativePaymentMode.findOne({ 'name': data.name })
      if (_postCreativePaymentMode === null) {
        const newPostCreativePaymentMode = new PostCreativePaymentMode(data)
        await newPostCreativePaymentMode.save()
        res.status(201).json(newPostCreativePaymentMode)
      } else {
        logger.error("Payment mode exists.")
        res.status(400).send("Payment mode exists.")
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredPostCreativePaymentModeSchemaObject), dataSet, requiredPostCreativePaymentModeSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update Post Creative Payment Mode
// @route   PATCH /admin/post_creative_payment_mode/:id Mongodb ObjectID(_id)
// @access  Private
export const updatePostCreativePaymentModes = asyncHandler(async (req, res) => {
  try{
    const { id: _id } = req.params
    const data = req.body
    if(_id !== undefined){
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("Invalid ID");
        return res.status(404).send("Invalid ID")
      }
      const updatedPostCreativePaymentMode = await PostCreativePaymentMode.findByIdAndUpdate(_id, { ...data, _id }, { new: true })

      if(updatedPostCreativePaymentMode !== null){
        updatedPostCreativePaymentMode.update_history = [
          ...updatedPostCreativePaymentMode.update_history,
          {...data, "timestamp": Date.now()}
        ]
        await updatedPostCreativePaymentMode.save()
        res.json(updatedPostCreativePaymentMode)
      }else{
        logger.error("Payment mode not found.");
        return res.status(404).send("Payment mode not found.")
      }
    }else{
      logger.error("ID is required.")
      res.status(400).send("ID is required.")
    }
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
