import asyncHandler from "express-async-handler"
import mongoose from "mongoose";
import logger from "../../logger/logger.js";
import { createOrGetAccount, logStackTrace } from "../util.js";
import Channel from "../../models/channel.js";
import WithdrawalRequest from "../../models/account/withdrawalRequest.js";
import IndividualEarning from "../../models/postedAds/individualEarning.js";


// @desc    Get All Individuals
// @route   GET /individual/
// @access  Private
export const getAllIndividuals = asyncHandler(async (req, res) => {
  try {
    let individuals = await Channel.find({ 'is_individual': true }).populate('user_id').sort({ createdAt: -1 })
    let response = []
    for (let individual of individuals) {
      const account = await createOrGetAccount(individual._id, false)
      let balance = "0.0"
      if (account[1] !== null) {
        balance = account[1]['balance']
      }

      let withdrawalRequest = await WithdrawalRequest.findOne({ 'channel_id': individual._id, 'is_approved': false })

      let obj = {
        "_id": individual['_id'],
        "user_id": individual['user_id'],
        "balance": balance,
        "is_active": individual['is_active'],
        "withdrawal_request": withdrawalRequest
      }
      response.push(obj)
    }
    res.json(response)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Individual
// @route   GET /individual/:id
// @access  Private
export const getIndividual = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid ID");
      return res.status(400).send("Invalid ID")
    }
    const _channel = await Channel.findById(_id).populate('user_id')
    if (_channel !== null) {
      const earnings = await IndividualEarning.find({ 'channel_id': _channel._id }).populate('payment_mode_id')
      res.json({ ..._channel._doc, "earnings": earnings })
    } else {
      logger.error("User not found with the specified ID")
      res.status(400).send("User not found with the specified ID")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

