import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js";
import { checkIntersection, getListCategorizedWithCreative, logStackTrace, prepareBodyForPublisherManagementService, returnErrorMessage, sendToPublisherManagementService, updateStatusOfStagedPostCreative, validateAndCreateStagedCreative, validateIDs, validatedListForStagedPostCreatives } from "../util.js";
import StagedPostCreative, { requiredStagedPostCreativeSchemaObject, stagedPostCreativeSchemaDescription } from "../../models/postCreatives/stagedPostCreatives.js";
import PostCreative from "../../models/postCreatives/postCreatives.js";
import Channel from "../../models/channel.js";
import mongoose from "mongoose";


// @desc    Create StagedPostCreative
// @route   POST /post_creatives/staged_post_creatives
// @access  Private
export const createStagedPostCreative = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    data['status_record'] = {
      "status": "staged",
      "timestamp": Date.now(),
      "user": req.auth._id
    }
    const validateAndCreateResponse = await validateAndCreateStagedCreative(data)
    if (validateAndCreateResponse[1] !== null) {
      let validatedData = await prepareBodyForPublisherManagementService([validateAndCreateResponse[1]])
      if (validatedData[0] === null) {
        // console.log(validatedData[1])
        const response = await sendToPublisherManagementService(validatedData[1])
        if (response[0] === null) {
          res.json(validateAndCreateResponse[1])

        } else {
          logger.error(response[0])
          return res.status(400).send(response[0])
        }
      } else {
        logger.error(validatedData[0])
        return res.status(400).send(validatedData[0])
      }
    } else {
      logger.error(validateAndCreateResponse[0]);
      res.status(400).send(validateAndCreateResponse[0])
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get All StagedPostCreatives
// @route   GET /post_creatives/staged_post_creatives
// @access  Private
export const getAllStagedPostCreatives = asyncHandler(async (req, res) => {
  try {
    const stagedPostCreatives = await StagedPostCreative.find().sort({ createdAt: -1 }).populate({
      path: 'post_creative_id',
      populate: {
        path: 'campaign_id',
        model: 'Campaign',
        select: '_id, name',
      }
    }).populate('channel_id')
    res.json(stagedPostCreatives)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Approve StagedPostCreative
// @route   PATCH /post_creatives/staged_post_creatives/decline/:id mongodb ObjectID
// @access  Private
export const declineStagedPostCreative = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (_id !== undefined) {
      let updateResponse = await updateStatusOfStagedPostCreative(_id, "declined", req)
      if (updateResponse[1] !== null) {
        res.json(updateResponse[1])
      } else {
        logger.error(updateResponse[0]);
        res.status(400).send(updateResponse[0])
      }
    } else {
      logger.error("StagedPostCreativeID(_id) is required.")
      return res.status(404).send('StagedPostCreativeID(_id) is required.')
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Approve StagedPostCreative
// @route   PATCH /post_creatives/staged_post_creatives/approve/:id mongodb ObjectID
// @access  Private
export const approveStagedPostCreative = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (_id !== undefined) {
      let updateResponse = await updateStatusOfStagedPostCreative(_id, "approved", req)
      if (updateResponse[1] !== null) {
        res.json(updateResponse[1])
      } else {
        logger.error(updateResponse[0]);
        res.status(400).send(updateResponse[0])
      }
    } else {
      logger.error("StagedPostCreativeID(_id) is required.")
      return res.status(404).send('StagedPostCreativeID(_id) is required.')
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Create StagedPostCreative
// @route   POST /post_creatives/staged_post_creatives/notify_channel
// @access  Private
export const notifyChannel = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let staged_post_creative_id = data.staged_post_creative_id
    if (staged_post_creative_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(staged_post_creative_id)) {
        logger.error("Invalid staged post creative ID")
        return res.status(404).send('Invalid staged post creative ID')
      }
      const _stagedPostCreative = await StagedPostCreative.findById(staged_post_creative_id)
      if (_stagedPostCreative !== null) {
        if (_stagedPostCreative.status === "staged" || _stagedPostCreative.status === "delayed") {
          _stagedPostCreative.status = "staged"
          _stagedPostCreative.staged_at = Date.now()
          let obj = _stagedPostCreative['status_record'] === undefined ? [] : _stagedPostCreative['status_record']
          let tempObj = [{
            "status": "staged",
            "timestamp": Date.now(),
            "user": req.auth._id
          }]
          _stagedPostCreative.status_record = [
            ...obj, ...tempObj
          ]
          await _stagedPostCreative.save()
          let validatedData = await prepareBodyForPublisherManagementService([_stagedPostCreative])
          if (validatedData[0] === null) {
            const response = await sendToPublisherManagementService(validatedData[1])
            if (response[0] === null) {
              res.json(response[1])

            } else {
              logger.error(response[0])
              return res.status(400).send(response[0])
            }
          } else {
            logger.error(validatedData[0])
            return res.status(400).send(validatedData[0])
          }
        } else {
          let message = `status is ${_stagedPostCreative.status} can not resend notification.`
          logger.error(message);
          res.status(400).send(message)
        }
      } else {
        let message = "No staged post creative with that ID."
        logger.error(message);
        res.status(400).send(message)
      }
    } else {
      let message = "StagedPostCreativeID(staged_post_creative_id) is required."
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


export const createStagedPostCreativeFromList = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const listsOfBody = data.list
    const isForce = data.is_force === undefined ? false : data.is_force
    if (listsOfBody !== undefined && Array.isArray(listsOfBody)) {
      // let lists = getListCategorizedWithCreative(listsOfBody)
      let responseList = []
      for (let ls of listsOfBody) {
        let post_creative_id = ls.post_creative_id
        let channels = ls.channels
        console.log(ls)
        let _list = []
        for (let channel of channels) {
          _list.push({
            "post_creative_id": post_creative_id,
            "channel_id": channel
          })
        }

        const validated = await validatedListForStagedPostCreatives(_list)
        if (validated === null) {
          let tempList = _list
          for (let obj of tempList) {
            obj['status_record'] = [{
              "status": "staged",
              "timestamp": Date.now(),
              "user": req.auth._id
            }]
          }

          const insertedList = await StagedPostCreative.insertMany(tempList)
          // return res.json(insertedList)
          let validatedData = await prepareBodyForPublisherManagementService(insertedList)
          if (validatedData[0] === null) {
            // console.log(validatedData[1])
            const response = await sendToPublisherManagementService(validatedData[1])
            if (response[0] === null) {
              responseList.push(insertedList)
            } else {
              logger.error(response[0])
              return res.status(400).send(response[0])
            }
          } else {
            logger.error(validatedData[0])
            return res.status(400).send(validatedData[0])
          }
        } else {
          logger.error(validated)
          return res.status(400).send(validated)
        }

      }
      res.json(responseList)

    } else {
      if (_list !== undefined) {
        logger.error("list should be array containing post creative id(post_creative_id) and Channel id(channel_id) required")
        return res.status(404).send('list should be array containing post creative id(post_creative_id) and Channel id(channel_id) required')
      }
      logger.error("list of staged post creatives(list) required")
      return res.status(404).send('list of staged post creatives(list) required')
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})



