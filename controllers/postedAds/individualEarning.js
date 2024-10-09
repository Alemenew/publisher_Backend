import mongoose from "mongoose"
import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { checkIntersection, createAccountBalanceLog, createAccountTransaction, createOrGetAccount, logStackTrace, returnErrorMessage, updateAccountBalance } from "../util.js"
import IndividualEarning, { requiredIndividualEarningBodyDescription, requiredIndividualEarningBodyObject } from "../../models/postedAds/individualEarning.js"
import { ACTION_TYPES, INDIVIDUAL_SAME_AD_LIMIT_PER_DAY } from "../constants.js"
import Channel from "../../models/channel.js"
import PostCreativePaymentMode from "../../models/admin/postCreativePaymentModes.js"
import PostCreativePaymentValues from "../../models/postCreatives/postCreativePaymentValues.js"
import PostCreative from "../../models/postCreatives/postCreatives.js"


// @desc    Get All Individual Earnings
// @route   GET /posted_ads/individual_earnings
// @access  Private
export const getAllIndividualEarnings = asyncHandler(async (req, res) => {
  try {
    const individualEarnings = await IndividualEarning.find()
    res.json(individualEarnings)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Get Individual Earning
// @route   GET /posted_ads/individual_earnings/:id Mongodb Object ID-> Channel_id
// @access  Private
export const getIndividualEarnings = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid ID");
      return res.status(404).send("Invalid ID")
    }
    const _individualEarnings = await IndividualEarning.find({ "channel_id": _id })
    res.json(_individualEarnings)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Add Individual Earning
// @route   POST /posted_ads/individual_earnings
// @access  Private
export const addIndividualEarnings = asyncHandler(async (req, res) => {
  try {
    const data = req.body
    let dataSet = new Set(Object.keys(data))
    let schemaSet = new Set(Object.keys(requiredIndividualEarningBodyObject))
    const intersection = checkIntersection(schemaSet, dataSet)
    if ([...intersection].length === [...schemaSet].length) {
      if (!mongoose.Types.ObjectId.isValid(data.post_creative_id)) {
        logger.error("Invalid Post Creative ID(post_creative_id) ID");
        return res.status(404).send("Invalid Post Creative ID(post_creative_id) ID")
      }
      if (!mongoose.Types.ObjectId.isValid(data.channel_id)) {
        logger.error("Invalid Channel ID(channel_id)");
        return res.status(404).send("Invalid Channel ID(channel_id)")
      }
      let _individualEarning = await IndividualEarning.find({
        "post_creative_id": data.post_creative_id,
        "channel_id": data.channel_id
      }).sort({ createdAt: -1 })
      _individualEarning = _individualEarning[0]
      let isValid = true
      if (_individualEarning !== null && _individualEarning !== undefined) {
        let now = Date.now()
        const day = INDIVIDUAL_SAME_AD_LIMIT_PER_DAY * 24 * 60 * 60 * 1000
        const diffInDays = Math.round(Math.abs((_individualEarning.createdAt - now) / day));
        if (INDIVIDUAL_SAME_AD_LIMIT_PER_DAY >= diffInDays) isValid = false
      }
      if (isValid) {
        const _channel = await Channel.findById(data.channel_id)
        const _postCreative = await PostCreative.findById(data.post_creative_id)
        if (_channel !== null && _postCreative !== null) {
          const _paymentMode = await PostCreativePaymentMode.findOne({ "name": data.payment_mode_key })
          if (_paymentMode !== null) {
            const _postCreativePaymentValue = await PostCreativePaymentValues.findOne({ "post_creative_id": _postCreative._id })
            let paymentValue = ""
            if (_postCreativePaymentValue !== null) {
              let paymentModeKey = data.payment_mode_key
              if (_postCreativePaymentValue.values[paymentModeKey] !== undefined) {
                paymentValue = _postCreativePaymentValue.values[paymentModeKey]
              } else {
                paymentValue = _paymentMode.default_price
              }
            } else {
              paymentValue = _paymentMode.default_price
            }
            let tempObj = {
              "post_creative_id": _postCreative._id,
              "channel_id": _channel._id,
              "payment_mode_id": _paymentMode._id,
              "payment": paymentValue
            }
            let newIndividualEarning = new IndividualEarning(tempObj)
            await newIndividualEarning.save()

            let adminAccount = await createOrGetAccount(null, true)
            let channelAccount = await createOrGetAccount(_channel._id, false)

            if (adminAccount[1] !== null && channelAccount[1] !== null) {
              let channelTransactionObj = {
                "from_account_id": adminAccount[1]._id,
                "to_account_id": channelAccount[1]._id,
                "is_credit": true,
                "is_debit": false,
                "amount": paymentValue
              }
              let channelTransaction = await createAccountTransaction(channelTransactionObj)
              if (channelTransaction[1] !== null) {
                let adminTransactionObj = {
                  "from_account_id": adminAccount[1]._id,
                  "to_account_id": channelAccount[1]._id,
                  "is_credit": false,
                  "is_debit": true,
                  "amount": paymentValue
                }
                let adminTransaction = await createAccountTransaction(adminTransactionObj)
                if (adminTransaction[1] !== null) {
                  let channelAccountBalanceLogObj = {
                    "account_id": channelAccount[1]._id,
                    "is_credit": true,
                    "is_debit": false,
                    "balance": channelAccount[1].balance,
                    "amount": paymentValue,
                    "earning_id": newIndividualEarning._id,
                    "transaction_id": channelTransaction[1]._id
                  }
                  let channelAccountBalanceLog = await createAccountBalanceLog(channelAccountBalanceLogObj)
                  if (channelAccountBalanceLog[1] !== null) {
                    let adminAccountBalanceLogObj = {
                      "account_id": adminAccount[1]._id,
                      "is_credit": false,
                      "is_debit": true,
                      "balance": adminAccount[1].balance,
                      "amount": paymentValue,
                      "transaction_id": adminTransaction[1]._id
                    }
                    let adminAccountBalanceLog = await createAccountBalanceLog(adminAccountBalanceLogObj)
                    if (adminAccountBalanceLog[1] !== null) {
                      let channelAccountBalanceUpdateObj = {
                        "action": ACTION_TYPES.credit,
                        "amount": paymentValue,
                        "previous_balance": channelAccount[1].balance,
                        "current_balance": channelAccount[1].balance,
                        "transaction_id": channelTransaction[1]._id
                      }
                      let channelAccountBalanceUpdate = await updateAccountBalance(channelAccountBalanceUpdateObj, channelAccount[1])
                      if (channelAccountBalanceUpdate[1] !== null) {
                        let adminAccountBalanceUpdateObj = {
                          "action": ACTION_TYPES.debit,
                          "amount": paymentValue,
                          "previous_balance": adminAccount[1].balance,
                          "current_balance": adminAccount[1].balance,
                          "transaction_id": adminTransaction[1]._id
                        }
                        let adminAccountBalanceUpdate = await updateAccountBalance(adminAccountBalanceUpdateObj, adminAccount[1])
                        if (adminAccountBalanceUpdate[1] !== null) {
                          res.status(201).json(newIndividualEarning)
                        } else {
                          logger.error(adminAccountBalanceUpdate[0])
                          res.status(400).send(adminAccountBalanceUpdate[0])
                        }
                      } else {
                        logger.error(channelAccountBalanceUpdate[0])
                        res.status(400).send(channelAccountBalanceUpdate[0])
                      }
                    } else {
                      logger.error(adminAccountBalanceLog[0])
                      res.status(400).send(adminAccountBalanceLog[0])
                    }
                  } else {
                    logger.error(channelAccountBalanceLog[0])
                    res.status(400).send(channelAccountBalanceLog[0])
                  }
                } else {
                  logger.error(adminTransaction[0])
                  res.status(400).send(adminTransaction[0])
                }
              } else {
                logger.error(channelTransaction[0])
                res.status(400).send(channelTransaction[0])
              }
            } else {
              let message = channelAccount[0]
              if (adminAccount[0] !== null) message = adminAccount[0]
              logger.error(message)
              res.status(400).send(message)
            }
          } else {
            logger.error("Invalid payment mode.")
            res.status(400).send("Invalid payment mode.")
          }
        } else {
          let message = "Channel not found."
          if (_channel !== null) {
            message = "Post creative not found."
          }
          logger.error(message)
          res.status(400).send(message)
        }
      } else {
        logger.error("Can't add earning, user already watched this ad.")
        res.status(400).send("Can't add earning, user already watched this ad.")
      }
    } else {
      let message = returnErrorMessage(Object.keys(requiredIndividualEarningBodyObject), dataSet, requiredIndividualEarningBodyDescription)
      logger.error(message)
      res.status(400).send(message)
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Update Individual Earning
// @route   PATCH /posted_ads/individual_earnings/:id Mongodb Object ID-> Individual Earning ID
// @access  Private
export const updateIndividualEarnings = asyncHandler(async (req, res) => {
  try {
    const { id: _id } = req.params
    const data = req.body
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      logger.error("Invalid ID");
      return res.status(404).send("Invalid ID")
    }
    const updatedIndividualEarning = await IndividualEarning.findByIdAndUpdate(_id, { ...data, _id }, { new: true })
    if (updatedIndividualEarning !== null) {
      res.json(updatedIndividualEarning)
    } else {
      logger.error("Earning not found not found.");
      return res.status(404).send("Earning not found not found.")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})