import asyncHandler from "express-async-handler"
import logger from "../../logger/logger.js"
import { fetchPostedAdStats, logStackTrace } from "../util.js"
import PostedAd from "../../models/postedAds/postedAds.js"
import { fetchChannelLastXPostStats, fetchMessageTest, fetchStats, fetchStatsTest } from "../stat_service.js"
import PostedAdStats from "../../models/postedAds/postedAdStats.js"
import { ChannelLastXNumberOfPostStat } from "../../models/channel.js"


// @desc    Fetch All Channel Last X Post Stat
// @route   GET /stat/fetch_channel_last_x_post_stat
// @access  Private
export const fetchChannelLastXPostStat = asyncHandler(async (req, res) => {
  try {
    const _channelLastXPostStats = await ChannelLastXNumberOfPostStat.find().populate('channel_id')
    for (let _channelLastXPostStat of _channelLastXPostStats) {
      await fetchChannelLastXPostStats(
        _channelLastXPostStat.channel_id.username,
        _channelLastXPostStat.last_message_id,
        _channelLastXPostStat.last_post_count,
        _channelLastXPostStat
      )
    }
    res.json(_channelLastXPostStats)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Test Fetch All Stats for postedAds
// @route   GET /stat/test_get_all_stat
// @access  Private
export const testGetAllStats = asyncHandler(async (req, res) => {
  try {
    let posts = [{
      "channel_username": "Dagu_Sport",
      "message_id": "39193",
      "posted_ad_id": 1
    }, {
      "channel_username": "tikvahethiopia",
      "message_id": "82734",
      "posted_ad_id": 2
    },
    {
      "channel_username": "rix_test_channel_3",
      "message_id": "2",
      "posted_ad_id": 3
    },
    {
      "channel_username": "TelegramTips",
      "message_id": "404",
      "posted_ad_id": 4
    }]
    const result = await fetchStatsTest(posts)
    res.json(result)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Test Fetch Messages
// @route   GET /stat/test_fetch_messages
// @access  Private
export const testGetMessages = asyncHandler(async (req, res) => {
  try {
    let posts = [{
      "channel_username": "Dagu_Sport",
      "message_id": "39193",
    },
    {
      "channel_username": "tikvahethiopia",
      "message_id": "82734"
    },
    {
      "channel_username": "rix_test_channel_3",
      "message_id": "2"
    },
    {
      "channel_username": "tikvahethiopia",
      "message_id": "82780"
    },
    {
      "channel_username": "tikvahethiopia",
      "message_id": "82781"
    },
    {
      "channel_username": "tikvahethiopia",
      "message_id": "82782"
    },
    {
      "channel_username": "tikvahethiopia",
      "message_id": "82783"
    },
    {
      "channel_username": "tikvahethiopia",
      "message_id": "82784"
    },
    {
      "channel_username": "tikvahethiopia",
      "message_id": "82785"
    },
    ]
    const result = await fetchMessageTest(posts)
    res.json(result)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Fetch All Stats for postedAds
// @route   GET /stat/get_all_stat
// @access  Private
export const getAllStats = asyncHandler(async (req, res) => {
  try {
    // const _postedAds = await PostedAd.find().sort({ createdAt: -1 }).populate('channel_id')
    // let posts = []
    // for (let postedAd of _postedAds) {
    //   posts.push({
    //     "channel_id": postedAd.channel_id._id,
    //     "channel_username": postedAd.channel_id.username,
    //     "message_id": postedAd.message_id,
    //     "posted_ad_id": postedAd._id
    //   })
    // }

    // let response = await fetchStats(posts)
    // let keys = Object.keys(response)
    // let newStats = []
    // let updatedStats = []
    // let createdStats = []
    // for(let key of keys){
    //   let _postedAdStat =  await PostedAdStats.findOne({'posted_ad_id': key})
    //   if(_postedAdStat !== null){
    //     let obj = {
    //       views: response[key],
    //       forwards: 0,
    //       views_list: [..._postedAdStat.views_list, response[key]],
    //       forwards_list: [..._postedAdStat.forwards_list, 0],
    //       recorded_at_timestamps: [..._postedAdStat.recorded_at_timestamps, Date.now()]
    //     }
    //     let id = _postedAdStat._id
    //     const updatedPostedAdStat = await PostedAdStats.findByIdAndUpdate(id, {...obj, id}, {new: true})
    //     updatedStats.push(updatedPostedAdStat)
    //   }
    //   else{
    //     newStats.push({
    //       views: response[key],
    //       forwards: 0,
    //       views_list: [response[key]],
    //       forwards_list: [ 0],
    //       recorded_at_timestamps: [ Date.now()],
    //       posted_ad_id: key
    //     })
    //   }
    // }

    // if(newStats.length > 0){
    //   const insertedList = await PostedAdStats.insertMany(newStats)
    //   createdStats = insertedList
    // }

    const response = await fetchPostedAdStats(true)
    res.json(response)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})
