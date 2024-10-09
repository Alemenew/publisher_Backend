import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { createOrGetAccount, logStackTrace } from "../util.js"
import Channel from "../../models/channel.js"
import AccountBalanceLog from "../../models/account/accountBalanceLogs.js"


// @desc    Get Individual Balance
// @route   GET /account/balance/:id -> Telegram User ID not Mongodb Ob1ectID
// @access  Private
export const getIndividualBalance = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const _channel = await Channel.findOne({ 'id': _id })
    if (_channel !== null) {
      const _account = await createOrGetAccount(_channel._id, false)
      if (_account[1] !== null) {
        res.json(_account[1])
      } else {
        logger.error("Account not found.");
        return res.send("Account not found.")
      }
    } else {
      logger.error("User not found.");
      return res.status(404).send("User not found.")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Individual Account Log
// @route   GET /account/account_log/:id -> Telegram User ID not Mongodb Ob1ectID
// @access  Private
export const getIndividualAccountLog = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const _channel = await Channel.findOne({ 'id': _id })
    if (_channel !== null) {
      const _account = await createOrGetAccount(_channel._id, false)
      if (_account[1] !== null) {
        const _accountLog = await AccountBalanceLog.find({
          'account_id': _account[1]._id
        }).sort({ createdAt: -1 })
        res.json(_accountLog)
      }else{
        logger.error("Account not found.");
        return res.send("Account not found.")
      }
    } else {
      logger.error("User not found.");
      return res.status(404).send("User not found.")
    }

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

