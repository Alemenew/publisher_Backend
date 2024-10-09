import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { addDefaultValuesForPostCreatives, checkIntersection, logStackTrace, returnErrorMessage, validateNumber } from "../util.js"
import PostCreativePaymentValues, { requiredPostCreativePaymentBodyDescription, requiredPostCreativePaymentBodyObject } from "../../models/postCreatives/postCreativePaymentValues.js"
import PostCreativePaymentMode from "../../models/admin/postCreativePaymentModes.js"
import PostCreative from "../../models/postCreatives/postCreatives.js"

// @desc    Get All Post Creative Payment Values
// @route   GET /post_creatives/post_creative_payment_values
// @access  Private
export const getAllPostCreativePaymentValues = asyncHandler(async (req, res) => {
  try {
    const postCreativePaymentValues = await PostCreativePaymentValues.find()
    res.json(postCreativePaymentValues)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Post Creative Payment Values
// @route   GET /post_creatives/post_creative_payment_values/:id -> Mongodb ObjectID of `PostCreative`
// @access  Private
export const getPostCreativePaymentValues = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("Invalid ID");
        return res.status(404).send("Invalid ID")
      }
      const postCreativePaymentValues = await PostCreativePaymentValues.findOne({
        'post_creative_id': _id
      })
      if (postCreativePaymentValues !== null) {
        res.json(postCreativePaymentValues)
      } else {
        logger.error(`No payment values for the ID: ${_id}`)
        res.status(400).send(`No payment values for the ID: ${_id}`)
      }
    } else {
      logger.error("ID is required.")
      res.status(400).send("ID is required.")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Create or Update Post Creative Payment Value
// @route   POST /post_creatives/post_creative_payment_values
// @access  Private
export const createPostCreativePaymentValue = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredPostCreativePaymentBodyObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      if(validateNumber(data.value)){
        const _postCreativePaymentMode = await PostCreativePaymentMode.findOne({ 'name': data.key })
        if (_postCreativePaymentMode !== null) {
          if (!mongoose.Types.ObjectId.isValid(data.post_creative_id)) {
            logger.error("Invalid post_creative_id ID");
            return res.status(404).send("Invalid post_creative_id ID")
          }
          const _postCreative = await PostCreative.findById(data.post_creative_id)
          if (_postCreative !== null) {
            const _postCreativePaymentValue = await PostCreativePaymentValues.findOne({
              'post_creative_id': data.post_creative_id
            })
            if (_postCreativePaymentValue !== null) {
              let values = { ..._postCreativePaymentValue.values }
              let keys = Object.keys(values)
              let updateHistory = [..._postCreativePaymentValue.update_history]
              if (keys.includes(data.key)) {
                updateHistory.push({
                  "key": data.key,
                  "value": data.value
                })
              }
              values[`${data.key}`] = data.value
              _postCreativePaymentValue.values = { ...values }
              _postCreativePaymentValue.update_history = [...updateHistory]
              await _postCreativePaymentValue.save()
              res.json(_postCreativePaymentValue)
            } else {
              let value = {}
              value[`${data.key}`] = data.value
              let dataObj = {
                'post_creative_id': _postCreative._id,
                'values': {
                  ...value
                }
              }
              const newPostCreativePaymentValue = new PostCreativePaymentValues(dataObj)
              await newPostCreativePaymentValue.save()
              res.status(201).json(newPostCreativePaymentValue)
            }
          } else {
            logger.error(`No post creative with ID ${data.post_creative_id}`)
            res.status(400).send(`No post creative with ID ${data.post_creative_id}`)
          }
        } else {
          logger.error("Invalid key(payment mode).")
          res.status(400).send("Invalid key(payment mode).")
        }
      }else {
        logger.error(`Invalid value, ${data.value}`)
        res.status(400).send(`Invalid value, ${data.value}`)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredPostCreativePaymentBodyObject), dataSet, requiredPostCreativePaymentBodyDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Set Default Post Creative Payment Value
// @route   POST /post_creatives/set_default_post_creative_payment_values/:id
// @access  Private
export const setDefaultPostCreativePaymentValue = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("Invalid ID");
        return res.status(404).send("Invalid ID")
      }
      const _postCreative = await PostCreative.findById(_id)
      if (_postCreative !== null) {
        const _postCreativePaymentModes = await PostCreativePaymentMode.find()
        const result = await addDefaultValuesForPostCreatives(_postCreative, _postCreativePaymentModes)
        if(result[0] === null){
          res.json(result[1])
        }else{
          res.json(result[0])
        }
      } else {
        logger.error("Post creative not found.")
        res.status(400).send("Post creative not found.")
      }
    } else {
      logger.error("ID is required.")
      res.status(400).send("ID is required.")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
