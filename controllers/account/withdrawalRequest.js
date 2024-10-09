import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import { checkIntersection, createOrGetAccount, logStackTrace, returnErrorMessage, validateWithdrawalAmount } from "../util.js"
import logger from "../../logger/logger.js"
import WithdrawalRequest, { requiredWithdrawalRequestSchemaDescription, requiredWithdrawalRequestSchemaObject } from "../../models/account/withdrawalRequest.js"
import Channel from "../../models/channel.js"
import Account from "../../models/account/account.js"


// @desc    Get All Withdrawal Requests
// @route   GET /account/withdrawal_request
// @access  Private
export const getAllWithdrawalRequests = asyncHandler(async (req, res) => {
  try {
    const _withdrawalRequests = await WithdrawalRequest.find().populate('account_id')
    res.json(_withdrawalRequests)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Individual Withdrawal Requests
// @route   GET /account/withdrawal_request/:id -> Telegram User ID not Mongodb ObjectID
// @access  Private
export const getIndividualWithdrawalRequests = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params

    const _channel = await Channel.findOne({ "id": _id })
    if (_channel !== null) {
      const _withdrawalRequest = await WithdrawalRequest.find({ 'channel_id': _channel._id }).populate('account_id')
      res.json(_withdrawalRequest)
    } else {
      logger.error("Individual channel not found.")
      res.status(404).send("Individual channel not found.")
    }


  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Create Withdrawal Request
// @route   POST /account/withdrawal_request
// @access  Private
export const createWithdrawalRequest = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredWithdrawalRequestSchemaObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      const _channel = await Channel.findOne({ "id": data.channel_id })
      if (_channel !== null) {
        const [_, _account] = await createOrGetAccount(_channel._id, false)
        if (_account !== null) {
          data.channel_id = _channel._id
          data.account_id = _account._id
          let isValid = validateWithdrawalAmount(data.withdrawal_amount, _account.balance)
          if (isValid === null) {
            let newWithdrawalRequest = new WithdrawalRequest(data)
            await newWithdrawalRequest.save()
            res.status(201).json(newWithdrawalRequest)
          } else {
            logger.error(isValid)
            res.status(400).send(isValid)
          }
        } else {
          logger.error("Account not found.")
          res.status(404).send("Account not found.")
        }
      } else {
        logger.error("Individual channel not found.")
        res.status(404).send("Individual channel not found.")
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredWithdrawalRequestSchemaObject), dataSet, requiredWithdrawalRequestSchemaDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Approve Withdrawal Request
// @route   PATCH /account/withdrawal_request/approve/:id -> Mongodb ObjectID
// @access  Private
export const approveWithdrawalRequest = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid ID");
      return res.status(404).send("Invalid ID")
    }
    const _withdrawalRequest = await WithdrawalRequest.findById(_id).populate('account_id')
    if (_withdrawalRequest !== null) {
      let isValid = validateWithdrawalAmount(_withdrawalRequest.withdrawal_amount, _withdrawalRequest.account_id.balance)
      if (isValid === null) {
        _withdrawalRequest.approved_at = Date.now()
        _withdrawalRequest.is_approved = true
        await _withdrawalRequest.save()
        res.json(_withdrawalRequest)
      } else {
        logger.error(isValid)
        res.status(400).send(isValid)
      }
    } else {
      logger.error("Withdrawal request not found.")
      res.status(404).send("Withdrawal request not found.")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})