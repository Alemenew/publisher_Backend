import asyncHandler from "express-async-handler"
import logger from "../../../logger/logger.js"
import cron from "node-cron"
import { activeCampaignPostedAdStatFetch, campaignStatusChangeCron, checkIfAdminRightFromChannelIsRevokedCron, fetchActiveChannelMessageAndStat, fetchNumberOfSubscribers, postAdsCron, stagedPostCreativeStatusChangeCron } from "./cron_functions.js"
import { fetchPostedAdStats, updateNumberOfSubscribers } from "../../util.js"


// @desc    Start Change Campaign Status Cron
// @route   GET /admin/start_campaign_status_change
// @access  Private
export const startCampaignStatusChange = asyncHandler(async (req, res) => {
  try {
    campaignStatusChangeCron()
    return res.send("Cron started")
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Start Change StagedAd Status Cron
// @route   GET /admin/start_staged_ad_status_change
// @access  Private
export const startStagedPostCreativeStatusChange = asyncHandler(async (req, res) => {
  try {
    stagedPostCreativeStatusChangeCron()
    return res.send("stagedPostCreativeStatusChangeCron started")
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Start Change StagedAd Status Cron
// @route   GET /admin/start_check_if_admin_right_from_channel_is_revoked
// @access  Private
export const startCheckIfAdminRightFromChannelIsRevoked = asyncHandler(async (req, res) => {
  try {
    checkIfAdminRightFromChannelIsRevokedCron()
    return res.send("checkIfAdminRightFromChannelIsRevokedCron started")
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Start Post Ad Cron
// @route   GET /admin/start_post_ad
// @access  Private
export const startPostAd = asyncHandler(async (req, res) => {
  try {
    postAdsCron()
    return res.send("postAdsCron started")
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Start Post Ad Cron
// @route   GET /admin/start_active_campaign_posted_ad_fetch_stat
// @access  Private
export const startActiveCampaignPostedAdStatFetch = asyncHandler(async (req, res) => {
  try {
    activeCampaignPostedAdStatFetch()
    return res.send("activeCampaignPostedAdStatFetch started")
    // let result = await fetchPostedAdStats(true)
    // console.log("DONEE")
    res.json(result)
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Start Channel Subscribers Count
// @route   GET /admin/start_channel_subscribers_count
// @access  Private
export const startChannelSubscriberCountFetchCron = asyncHandler(async (req, res) => {
  try {
    fetchNumberOfSubscribers()
    // updateNumberOfSubscribers()
    return res.send("fetchNumberOfSubscribers started")

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})

// @desc    Start Channel Subscribers Count
// @route   GET /admin/start_active_channel_message_and_stat
// @access  Private
export const startActiveChannelMessageAndStat = asyncHandler(async (req, res) => {
  try {
    fetchActiveChannelMessageAndStat()
    // updateNumberOfSubscribers()
    return res.send("fetchActiveChannelMessageAndStat started")

  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})


// @desc    Start All Crons
// @route   GET /admin/start_all_crons
// @access  Private
export const startAllCrons = asyncHandler(async (req, res) => {
  try {
    activeCampaignPostedAdStatFetch()
    logger.info("activeCampaignPostedAdStatFetch started")

    postAdsCron()
    logger.info("postAdsCron started")

    checkIfAdminRightFromChannelIsRevokedCron()
    logger.info("checkIfAdminRightFromChannelIsRevokedCron started")

    campaignStatusChangeCron()
    logger.info("campaignStatusChangeCron started")

    stagedPostCreativeStatusChangeCron()
    logger.info("stagedPostCreativeStatusChangeCron started")

    fetchNumberOfSubscribers()
    logger.info("fetchNumberOfSubscribers started")

    // fetchActiveChannelMessageAndStat()
    // logger.info("fetchActiveChannelMessageAndStat started")

    return res.send("Cron jobs started.")
  } catch (error) {
    logger.error(error.message)
    logStackTrace(error.stack)
    res.status(500).json({ message: error.message })
  }
})