import asyncHandler from "express-async-handler"
import mongoose from "mongoose";
import logger from "../../logger/logger.js";
import { addReactionToIndividualPost, addReactionToPost, checkIntersection, logStackTrace, returnErrorMessage } from "../util.js";
import PostedAdForIndividual from "../../models/postedAds/postedAdForIndividual.js";
import { boolean } from "webidl-conversions";
import PostedAd from "../../models/postedAds/postedAds.js";
import PostCreative from "../../models/postCreatives/postCreatives.js";


// @desc    Save Web Visit Engagement
// @route   GET /engagement/web_visit/:id (Combination of CreativeID and ChannelID->Mongodb Object ID)
// @access  Private
export const webVisitEngagement = asyncHandler(async (req, res) => {
  try {
    const { id: id } = req.params
    let variables = id.toString().split("|")
    let post_creative_id = variables[0]
    let channel_id = variables[1]
    let is_individual = parseInt(variables[2].toString())

    if (is_individual === 1) {
      let source = `${req.ip}-${req.headers['user-agent']}`
      let _postedAd = await PostedAd.find({
        'post_creative_id': post_creative_id,
        'channel_id': channel_id
      }).sort({ createdAt: -1 })

      if (_postedAd.length > 0) {
        _postedAd = _postedAd[0]
        await addReactionToPost(_postedAd, "WEBSITE_URL", source)
        let _postCreative = await PostCreative.findById(post_creative_id)
        if (_postCreative !== null) {
          let url = _postCreative.website || process.env.DEFAULT_REDIRECT_URL || 'https://aiqem.tech'
          res.redirect(url)
        } else {
          res.redirect(process.env.DEFAULT_REDIRECT_URL);
        }
      } else {
        res.redirect(process.env.DEFAULT_REDIRECT_URL);
      }
    } else {
      let _postedAdForIndividual = await PostedAdForIndividual.find({
        'post_creative_id': post_creative_id,
        'channel_id': channel_id
      }).sort({ createdAt: -1 })
      if (_postedAdForIndividual.length > 0) {
        _postedAdForIndividual = _postedAdForIndividual[0]
        await addReactionToIndividualPost(_postedAdForIndividual, "WEBSITE_URL")
        let _postCreative = await PostCreative.findById(post_creative_id)
        if (_postCreative !== null) {
          let url = _postCreative.website || process.env.DEFAULT_REDIRECT_URL || 'https://aiqem.tech'
          res.redirect(url)
        } else {
          res.redirect(process.env.DEFAULT_REDIRECT_URL);
        }
      } else {
        res.redirect(process.env.DEFAULT_REDIRECT_URL);
      }
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.redirect(process.env.DEFAULT_REDIRECT_URL);
    // res.status(500).json({ message: error.message })
  }
})

// @desc    Save Web Visit Engagement
// @route   GET /engagement/call_us/:id (Combination of CreativeID and ChannelID->Mongodb Object ID)
// @access  Private
export const callUsEngagement = asyncHandler(async (req, res) => {
  try {
    const { id: id } = req.params
    let variables = id.toString().split("|")
    let post_creative_id = variables[0]
    let channel_id = variables[1]
    let is_individual = parseInt(variables[2].toString())

    if (is_individual === 1) {
      let source = `${req.ip}-${req.headers['user-agent']}`
      let _postedAd = await PostedAd.find({
        'post_creative_id': post_creative_id,
        'channel_id': channel_id
      }).sort({ createdAt: -1 })
      if (_postedAd.length > 0) {
        _postedAd = _postedAd[0]
        await addReactionToPost(_postedAd, "CALL", source)
        let _postCreative = await PostCreative.findById(post_creative_id)
        if (_postCreative !== null) {
          let phone_number = _postCreative.phone_number || process.env.DEFAULT_PHONE_NUMBER || '+251988800031'
          res.redirect(`tel:${phone_number}`)
        } else {
          res.redirect(`tel:${process.env.DEFAULT_PHONE_NUMBER}`);
        }
      } else {
        res.redirect(`tel:${process.env.DEFAULT_PHONE_NUMBER}`);
      }
    } else {
      let _postedAdForIndividual = await PostedAdForIndividual.find({
        'post_creative_id': post_creative_id,
        'channel_id': channel_id
      }).sort({ createdAt: -1 })
      if (_postedAdForIndividual.length > 0) {
        _postedAdForIndividual = _postedAdForIndividual[0]
        await addReactionToIndividualPost(_postedAdForIndividual, "CALL")
        let _postCreative = await PostCreative.findById(post_creative_id)
        if (_postCreative !== null) {
          let phone_number = _postCreative.phone_number || process.env.DEFAULT_PHONE_NUMBER || '+251988800031'
          res.redirect(`tel:${phone_number}`)
        } else {
          res.redirect(`tel:${process.env.DEFAULT_PHONE_NUMBER}`);
        }
      } else {
        res.redirect(`tel:${process.env.DEFAULT_PHONE_NUMBER}`);
      }
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.redirect(`tel:${process.env.DEFAULT_PHONE_NUMBER}`);

  }
})

// @desc    Add reactions
// @route   POST /engagement/add_reaction
// @access  Private
export const addReactionEngagement = asyncHandler(async (req, res) => {
  try {
    let requiredBody = {
      "post_creative_id": "Post creative ID",
      "channel_id": "Channel ID",
      "is_individual": "Is Individual",
      "reaction": "Reaction"
    }
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredBody))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      if (!data.is_individual) {

      } else {
        let _postedAdForIndividual = await PostedAdForIndividual.find({
          'post_creative_id': data.post_creative_id,
          'channel_id': data.channel_id
        }).sort({ createdAt: -1 })
        if (_postedAdForIndividual.length > 0) {
          _postedAdForIndividual = _postedAdForIndividual[0]
          await addReactionToIndividualPost(_postedAdForIndividual, data.reaction)
          res.json(_postedAdForIndividual)
        } else {
          logger.error("No posted ad found for this channel.")
          res.status(400).send("No posted ad found for this channel.")
        }
      }
    }
    else {
      let message = returnErrorMessage(Object.keys(requiredBody), dataSet, requiredBody)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
