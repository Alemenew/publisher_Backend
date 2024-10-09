import asyncHandler from "express-async-handler"
import mongoose from "mongoose";
import logger from "../../logger/logger.js";
import { logStackTrace } from "../util.js";
import Channel from "../../models/channel.js";
import UserData from "../../models/userData/userData.js";


// @desc    Save User Data
// @route   POST /admin/user_data/:id (telegram user/channel id) not _id -> Mongodb objectID
// @access  Private
export const saveUserData = asyncHandler(async (req, res) => {
  try {
    const { id: id } = req.params
    const data = req.body
    let _channel = await Channel.findOne({ 'id': id })
    if (_channel !== null) {
      let _userData = await UserData.findOne({ 'channel_id': _channel._id })
      if (_userData !== null) {
        _userData.data = data
        await _userData.save()
        res.json(_userData)
      } else {
        let newUserData = new UserData({
          'channel_id': _channel._id,
          data: { ...data }
        })
        await newUserData.save()
        res.status(201).json(newUserData)
      }
    } else {
      logger.error("Channel not found.")
      res.status(400).send("Channel not found.")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }

})

// @desc    GET User Data
// @route   GET /admin/user_data/:id (telegram user/channel id) not _id -> Mongodb objectID
// @access  Private
export const getUserData = asyncHandler(async (req, res) => {
  try {
    const { id: id } = req.params
    let _channel = await Channel.findOne({ 'id': id })
    if (_channel !== null) {
      let _userData = await UserData.findOne({ 'channel_id': _channel._id })
      if (_userData !== null) {
        res.json(_userData)
      } else {
        logger.error("No data found.")
        res.status(400).send("No data found.")
      }
    } else {
      logger.error("Channel not found.")
      res.status(400).send("Channel not found.")
    }
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})