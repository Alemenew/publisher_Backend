import cron from "node-cron"
import logger from "../../../logger/logger.js";
import Campaign from "../../../models/campaigns/campaigns.js";
import { checkIfCampaignIsActive, fetchPostedAdStats, getCampaignChannels, logStackTrace, postAdAutoService, prepareReport, sendReportToChannel, sendToAdMasterService, sendToPublisherManagementService, updateChannelMessageViews, updateNumberOfSubscribers } from "../../util.js";
import StagedPostCreative from "../../../models/postCreatives/stagedPostCreatives.js";
import moment from "moment-timezone"
import { CAMPAIGN_REPORT_CAPTION, STAGED_AD_TO_DELAYED_LIMIT_IN_DAYS } from "../../constants.js";
import Channel, { ChannelLastXNumberOfPostStat } from "../../../models/channel.js";
import { fetchChannelLastXPostStats } from "../../stat_service.js";



export const campaignStatusChangeCron = async () => {
  // cron.schedule('0 * * * *', async () => {
  cron.schedule('*/5 * * * *', async () => {
    logger.info("campaignStatusChangeCron running.")
    const _campaigns = await Campaign.find({ 'status': 'active' })
    for (let _campaign of _campaigns) {
      if (!checkIfCampaignIsActive(_campaign.campaign_end_date)) {
        _campaign.status = "inactive"
        await _campaign.save()
        let _channels = await getCampaignChannels(_campaign)
        for (let _channel_id of _channels) {
          let _channel = await Channel.findById(_channel_id).populate('user_id')
          if (_channel) {
            let pdf = await prepareReport(_campaign._id, _channel._id)
            let caption = CAMPAIGN_REPORT_CAPTION.replace('CAMPAIGN', _campaign.name)
            await sendReportToChannel(
              _channel.user_id.id, pdf, `${_channel.title}-${_campaign.name}.pdf`, caption
            )
            logger.info(`Campaign: ${_campaign.name} Report sent to channel: ${_channel.title}`)
          }

        }
      }
    }
  });
}

export const stagedPostCreativeStatusChangeCron = async () => {
  cron.schedule('0 * * * *', async () => {
    logger.info("stagedPostCreativeStatusChangeCron running.")
    const _stagedPostCreatives = await StagedPostCreative.find({ 'status': 'staged' })
    let now = moment.tz(Date.now(), 'Africa/Addis_Ababa')
    for (let _stagedPostCreative of _stagedPostCreatives) {
      let staged_at = moment.tz(Date.parse(_stagedPostCreative.staged_at), 'Africa/Addis_Ababa')
      let difference = now.diff(staged_at, 'days')
      if (difference > STAGED_AD_TO_DELAYED_LIMIT_IN_DAYS) {
        _stagedPostCreative.status = "delayed"
        _stagedPostCreative.delayed_at = Date.now()
        let obj = _stagedPostCreative['status_record'] === undefined ? [] : _stagedPostCreative['status_record']
        let tempObj = [{
          "status": "delayed",
          "timestamp": Date.now(),
          "user": "CRON"
        }]
        _stagedPostCreative.status_record = [
          ...obj, ...tempObj
        ]
        await _stagedPostCreative.save()
      }
    }

  });
}


export const checkIfAdminRightFromChannelIsRevokedCron = async () => {
  cron.schedule('0 * * * *', async () => {
    logger.info("checkIfAdminRightFromChannelIsRevoked running.")
    const channels = await Channel.find({ "is_active": true, "is_individual": false }).populate('user_id')
    let checkIsAdminReqBody = {
      "channels": []
    }
    let channelsList = {}

    for (let channel of channels) {
      checkIsAdminReqBody['channels'].push({
        "id": channel._id.toString(),
        "channel_id": channel.id
      })
      channelsList[channel._id.toString()] = channel
    }
    let response = await sendToAdMasterService(checkIsAdminReqBody, "check_right")
    // console.log(response) 
    if (response[1].length > 0) {
      let channelLists = response[1]
      let notifyChannelOwnersRequestBody = {
        "text": "<b>Your channel: CHANNEL_HANDLE </b> has been <b>DEACTIVATED! 🚫🚫🚫🚫</b>\n\nWe detected that you have revoked admin rights from our bot for your channel: CHANNEL_HANDLE .\n\nPlease add https://t.me/AiqemAdsMasterBot as an admin on your channel and click verify.\n The bot needs admin access to post ads on your channel.",
        "channels": []
      }
      for (let channel of channelLists) {
        let _channel = channelsList[channel._id]
        _channel.is_active = false
        await _channel.save()
        notifyChannelOwnersRequestBody['channels'].push({
          "id": _channel._id.toString(),
          "user_id": _channel.user_id.id.toString(),
          "channel_handle": _channel.channel_handle,
          "channel_id": _channel.id
        })
      }
      // console.log(notifyChannelOwnersRequestBody)

      const notifyChannelResponse = await sendToPublisherManagementService(notifyChannelOwnersRequestBody, 'notify_admin_right_revoked')
      // console.log(notifyChannelResponse)
      let keys = Object.keys(notifyChannelResponse)
      for (let key of keys) {
        let success = notifyChannelResponse[key].success
        if (!success) logger.error(notifyChannelResponse[key].error)
      }
    }
  });
}

export const postAdsCron = async () => {
  cron.schedule('0 * * * *', async () => {
    // cron.schedule('*/3 * * * *', async () => {
    try {
      logger.info("postAdsCron running.")
      await postAdAutoService()
    } catch (error) {
      logger.error(error.message)
      logStackTrace(error.stack)
    }
  })
}

export const activeCampaignPostedAdStatFetch = async () => {
  cron.schedule('0 * * * *', async () => {
    // cron.schedule('*/3 * * * *', async () => {
    try {
      logger.info("activeCampaignPostedAdStatFetch running.")
      await fetchPostedAdStats(true)
    } catch (error) {
      logger.error(error.message)
      logStackTrace(error.stack)
    }
  })
}

export const activeChannelsLastXPostStatFetch = async () => {
  // cron.schedule('0 * * * *', async () => {
  //   // cron.schedule('*/3 * * * *', async () => {
  //   try {
  //     logger.info("activeChannelsLastXPostStatFetch running.")
  //     const _channelLastXPostStats = await ChannelLastXNumberOfPostStat.find().populate('channel_id')
  //     for (let _channelLastXPostStat of _channelLastXPostStats) {
  //       if (_channelLastXPostStat.channel_id.is_active) {
  //         await fetchChannelLastXPostStats(
  //           _channelLastXPostStat.channel_id.username,
  //           _channelLastXPostStat.last_message_id,
  //           _channelLastXPostStat.last_post_count,
  //           _channelLastXPostStat
  //         )
  //       }
  //     }
  //   } catch (error) {
  //     logger.error(error.message)
  //     logStackTrace(error.stack)
  //   }
  // })
}

export const fetchNumberOfSubscribers = async () => {
  // updateNumberOfSubscribers()

  cron.schedule('0 * * * *', async () => {
    // cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info("fetchNumberOfSubscribers running.")
      updateNumberOfSubscribers()
    } catch (error) {
      logger.error(error.message)
      logStackTrace(error.stack)
    }
  })
}


export const fetchActiveChannelMessageAndStat = async () => {
  cron.schedule('0 0 * * *', async () => {
    // cron.schedule('*/3 * * * *', async () => {
    try {
      logger.info("fetchActiveChannelMessageAndStat running.")
      updateChannelMessageViews()
    } catch (error) {
      logger.error(error.message)
      logStackTrace(error.stack)
    }
  })
}

