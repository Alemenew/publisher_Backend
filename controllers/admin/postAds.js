import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, getDaySectionBasedOnCurrentTime, logStackTrace, postAdAutoService, preparePostMessageForAdMasterPostAdService, returnErrorMessage, savePostedAd, sendToAdMasterService, validateBodyForPostAdManually } from "../util.js"
import { postAdObjectDescription, requiredPostAdObject } from "../../models/admin/postAd.js"


// @desc    POST Ads on Channels
// @route   GET /admin/post_ads_auto
// @access  Private
export const postAdsAuto = asyncHandler(async (req, res) => {
  try {
    const result = await postAdAutoService()
    res.json({result:result})
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    POST Ads on Channels Manually
// @route   GET /admin/post_ad_manually
// @access  Private
export const PostAdsManually = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const objectSet = new Set(Object.keys(requiredPostAdObject))
    let intersection = checkIntersection(objectSet, dataSet)
    if ([...intersection].length === [...objectSet].length) {
      let isValid = await validateBodyForPostAdManually(data)
      if (isValid === null) {
        let bodyData = await preparePostMessageForAdMasterPostAdService(data.post_creative_id, data.channel_list)
        if (bodyData[0] === null) {
          const result = await sendToAdMasterService(bodyData[1])
          if (result[0] === null) {
            let response = result[1]
            const SaveResult = await savePostedAd(data.post_creative_id, response)
            if (SaveResult[0] === null) {
              res.json(SaveResult[1])
            } else {
              logger.error(SaveResult[0])
              res.status(400).send(SaveResult[0])
            }
          } else {
            logger.error(result[0])
            res.status(400).send(result[0])
          }
        } else {
          logger.error(bodyData[0])
          res.status(400).send(bodyData[0])
        }
      } else {
        logger.error(isValid)
        res.status(400).send(isValid)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredPostAdObject), dataSet, postAdObjectDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
