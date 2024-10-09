import mongoose from "mongoose"
import logger from "../../logger/logger.js"
import asyncHandler from "express-async-handler"
import CampaignGoal, {requiredCampaignGoalSchemaObject, campaignGoalSchemaDescription} from "../../models/admin/campaignGoal.js"
import { checkIntersection, logStackTrace, returnErrorMessage, validateListForCampaignGoal } from "../util.js"


// @desc    Create Campaign Goal
// @route   POST /admin/campaign_goal
// @access  Private
export const createCampaignGoal = asyncHandler(async (req, res) => {
  try{
    const data = req.body
    const dataSet = new Set(Object.keys(data))
    const schemaSet = new Set(Object.keys(requiredCampaignGoalSchemaObject))
    let intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length == [...schemaSet].length) {
      const _campaignGoal = await CampaignGoal.findOne({'campaign_goal_key': data.campaign_goal_key})
      if(_campaignGoal === null){
        const newCampaignGoal = new CampaignGoal(data)
        await newCampaignGoal.save()
        res.status(201).json(newCampaignGoal)
      }else{
        logger.error(`Campaign goal with key ${data.campaign_goal_key} already exists.`)
        res.status(400).json(`Campaign goal with key ${data.campaign_goal_key} already exists.`)
      }
    }else {
      let message = returnErrorMessage(Object.keys(requiredCampaignGoalSchemaObject), dataSet, campaignGoalSchemaDescription)
      logger.error(message)
      res.status(400).json(message)
    }
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Get Campaign Goals
// @route   GET /admin/campaign_goal
// @access  Private
export const getCampaignGoals = asyncHandler(async (req, res) => {
  try{
    const campaignGoals = await CampaignGoal.find()
    res.status(200).json(campaignGoals)
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Update Campaign Goal
// @route   PATCH /admin/campaign_goal/:id mongodb ObjectID
// @access  Private
export const updateCampaignGoal = asyncHandler(async (req, res) => {
  try{
    const { id: _id } = req.params
    const data = req.body
    if (_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(404).send("No campaign goal with this ID")
      const updatedCampaignGoal = await CampaignGoal.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
      res.json(updatedCampaignGoal)
    } else {
      logger.error("Campaign goal ID(_id) is required.")
      res.status(400).send("Campaign goal ID(_id) is required.")
    }
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Create Campaign Goal from list
// @route   POST /admin/campaign_goal/create_from_list
// @access  Private
export const createCampaignGoalFromList = asyncHandler(async (req, res) => {
  try{
    const data = req.body
    const _list = data.list
    if(_list !== undefined && Array.isArray(_list)){
      const isValid = await validateListForCampaignGoal(_list)
      if(isValid === null){
        const insertedList = await CampaignGoal.insertMany(_list)
        res.json(insertedList)
      }else{
        logger.error(isValid)
      res.status(400).send(isValid)
      }
    }else{
      let message = ''
      if(_list === undefined){
        message = "list of 'campaign_goal_key' and 'campaign_goal_value' required."
      }else{
        message = "'list' should be array of 'campaign_goal_key' and 'campaign_goal_value'"
      }
      logger.error(message)
      res.status(400).send(message)
    }
  }catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
