import express from "express";
import {
    UpdateChannelTierKPIValue,
    activateUserChannel,
    addTierToChannel,
    createChannel,
    deactivateUserChannel,
    downloadCampaignReport,
    getChannel,
    getChannels,
    getChannelsWithViews,
    getIndividualChannel,
    getUserChannel,
    sendCampaignReportToChannel,
    updateChannel,
    checkAdminRight
} from "../controllers/channel/channel.js";
import { createChannelPreference, createIndividualPreference, getChannelPreference } from "../controllers/channel/channelPreference.js";
import authenticate from "../middleware/authenticationMiddleware.js";
import checkEmptyString from "../middleware/checkEmptyStringMiddleware.js";
import { createChannelStat, getAllChannelStat, getChannelStat } from "../controllers/channel/channelAvgStat.js";
import { createChannelLastXPostStat, getAllChannelsLastXPostStat, getChannelLastXPostStat } from "../controllers/channel/channelLastXPostStat.js";
import { saveLastMessageIDAndPostPerDay } from "../controllers/channel/channelMessage.js";

const router = express.Router()

router.get('/', getChannels)
router.post('/', authenticate, createChannel)
router.get('/channel_with_views', getChannelsWithViews)

router.post('/save_last_message_id_and_post_per_day', checkEmptyString, saveLastMessageIDAndPostPerDay)



router.get('/user_channels/:id', authenticate, getUserChannel)
router.get('/individual_channel/:id', authenticate, getIndividualChannel)
router.post('/user_channels/deactivate_channel', authenticate, deactivateUserChannel)
router.post('/user_channels/activate_channel', authenticate, checkEmptyString, activateUserChannel)


router.post('/preference/:id', authenticate, createChannelPreference)
router.post('/individual_preference/:id', authenticate, createIndividualPreference)
router.get('/preference/:id', authenticate, getChannelPreference)

router.get('/channel_stat', authenticate, getAllChannelStat)
router.get('/channel_stat/get_all_channel_last_x_post_stat', authenticate, getAllChannelsLastXPostStat)
router.post('/channel_stat/create_channel_last_x_post_stat', authenticate, checkEmptyString, createChannelLastXPostStat)
router.get('/channel_stat/get_all_channel_last_x_post_stat/:id', authenticate, getChannelLastXPostStat)

router.get('/channel_stat/:id', authenticate, getChannelStat)
router.post('/channel_stat/:id', authenticate, checkEmptyString, createChannelStat)


router.post('/add_tier/:id', authenticate, checkEmptyString, addTierToChannel)

router.post('/download_campaign_report/:id', authenticate, checkEmptyString, downloadCampaignReport)
router.post('/send_campaign_report_to_channel/:id', authenticate, checkEmptyString, sendCampaignReportToChannel)
router.patch('/update_channel_tier_kpi_value/:id', authenticate, checkEmptyString, UpdateChannelTierKPIValue)

router.post('/check_admin_right/:id', authenticate, checkAdminRight)


router.get('/:id', authenticate, getChannel)
router.patch('/:id', authenticate, updateChannel)





export default router