import mongoose from "mongoose";
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js";
import { checkIntersection, logStackTrace, returnErrorMessage } from "../util.js";
import ChannelTier, { requiredChannelTiersSchemaDescription, requiredChannelTiersBodyObject } from "../../models/admin/channelTiers.js";


// @desc    Get All Channel Tier
// @route   GET /admin/channel_tier
// @access  Private
export const getAllChannelTier = asyncHandler(async (req, res) => {
  try {
    const _channelTiers = await ChannelTier.find().sort({ createdAt: -1 })
    res.json(_channelTiers)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})



// @desc    Create Channel Tier
// @route   POST /admin/channel_tier
// @access  Private
export const createChannelTier = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredChannelTiersBodyObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length == [...schemaSet].length) {
      const _channelTier = await ChannelTier.findOne({ 'name': data.name })
      if (_channelTier === null) {
        let KPI = [{
          "name": data.KPI,
          "value": data.value
        }]
        let body = { "name": data.name, KPI: [...KPI] }
        let newChannelTier = new ChannelTier(body)
        await newChannelTier.save()
        res.status(201).json(newChannelTier)
      } else {
        let KPI = []
        for (let i = 0; i < _channelTier.KPI.length; i++) {
          KPI.push({
            "name": _channelTier.KPI[i].name,
            "value": _channelTier.KPI[i].name === data.KPI ? data.value : _channelTier.KPI[i].value
          })
        }
        _channelTier.KPI = [...KPI]
        await _channelTier.save()
        res.json(_channelTier)
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredChannelTiersBodyObject), dataSet, requiredChannelTiersSchemaDescription)
      logger.error(message);
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})