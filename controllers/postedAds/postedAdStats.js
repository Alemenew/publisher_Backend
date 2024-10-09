import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js"
import PostedAdStats, { postedAdStatsSchemaDescription, requiredPostedAdStatsSchemaObject } from "../../models/postedAds/postedAdStats.js"
import PostedAd from "../../models/postedAds/postedAds.js"
import mongoose from "mongoose"


// @desc    Create PostedAd Stats
// @route   POST /posted_ads/stats/posted_ad
// @access  Private
export const createPostedAdStat = asyncHandler(async (req, res) => {
  try{
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredPostedAdStatsSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      let posted_ad_id = data.posted_ad_id
      if (!mongoose.Types.ObjectId.isValid(posted_ad_id)) {
        logger.error("No posted Ad with this ID");
        return res.status(400).send("No posted Ad with this ID")
      }
      const _postedAd = await PostedAd.findById(data.posted_ad_id)
      if(_postedAd !== null){
        const _postedAdStat = await PostedAdStats.findOne({'posted_ad_id': posted_ad_id})
        if(_postedAdStat === null){
          data.views_list = [data.views]
          data.forwards_list = [data.forwards]
          data.recorded_at_timestamps = [Date.now()]
          const newPostedAdStat = new PostedAdStats(data)
          await newPostedAdStat.save()
          res.json(newPostedAdStat)
        }else{
          data.views_list = [..._postedAdStat.views_list, data.views]
          data.forwards_list = [..._postedAdStat.forwards_list, data.forwards]
          data.recorded_at_timestamps = [..._postedAdStat.recorded_at_timestamps, Date.now()]
          let id = _postedAdStat._id
          const updatedPostedAdStat = await PostedAdStats.findByIdAndUpdate(id, {...data, id}, {new: true})
          res.json(updatedPostedAdStat)
        }
      }else{
        logger.error(`No posted Ad found under the ID '${data.posted_ad_id}'`)
        res.status(400).send(`No posted Ad found under the ID '${data.posted_ad_id}'`)
      }

    }else {
      let message = returnErrorMessage(Object.keys(requiredPostedAdStatsSchemaObject), dataSet, postedAdStatsSchemaDescription)
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
// @route   GET /posted_ads/stats/posted_ad/:id->posted_ad_id mongodb ObjectID
// @access  Private
export const getPostedAdStats =  asyncHandler(async (req, res) => {
  try{
    const { id: _id } = req.params
    if (_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        logger.error("No posted Ad with this ID");
        return res.status(400).send("No posted Ad with this ID")
      }
      const _postedAdStat = await PostedAdStats.findOne({'posted_ad_id': _id}).populate({
        path: 'posted_ad_id',
        populate:{
          path: 'post_creative_id',
          model: 'PostCreative',
          select: ' _id, name',
          populate:{
            path: 'campaign_id',
            model: 'Campaign',
            select: '_id, name',
          }
        }
      }).populate({
        path: 'posted_ad_id',
        populate:{
          path: 'channel_id',
          model: 'Channel',
          select: '_id, title',
        }
      })
      if(_postedAdStat !== null){
        res.json(_postedAdStat)
      }
      else{
        logger.error(`No stat found for the posted AD ID:'${_id}'`)
        res.status(400).send(`No stat found for the posted AD ID:'${_id}'`)
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


// @desc    Get All PostedAd Stats 
// @route   GET /posted_ads/stats
// @access  Private
export const getAllPostedAdStats = asyncHandler(async (req, res) => {
  try{
    const postedAdStats = await PostedAdStats.find().sort({ createdAt: -1 }).populate({
      path: 'posted_ad_id',
      populate:{
        path: 'post_creative_id',
        model: 'PostCreative',
        select: ' _id, name',
        populate:{
          path: 'campaign_id',
          model: 'Campaign',
          select: '_id, name',
        }
      }
    }).populate({
      path: 'posted_ad_id',
      populate:{
        path: 'channel_id',
        model: 'Channel',
        select: '_id, title',
      }
    })
    res.json(postedAdStats)
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
