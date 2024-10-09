import express from "express"
import { changeCampaignStatus, createCampaign, fetchStatAndDeleteAd, getAllCampaigns, getAllCompatibleChannels, getCampaignChannelViewReport, getCampaignConversionBot, getCampaignConversionCreatives, getCampaignConversionEngagements, getCampaignCreatives, getCampaignDetail, getCampaignPostedAds, getChannelsApprovedCreative, getCompanyCampaigns, updateCampaign } from "../controllers/campaign/campaign.js"
import authenticate from "../middleware/authenticationMiddleware.js"
import checkEmptyString from "../middleware/checkEmptyStringMiddleware.js"
import { createConversionBot, getActiveConversionBots, getAllConversionBots, updateConversionBot } from "../controllers/campaign/conversionBot.js"

const router = express.Router()

router.get("/", authenticate, getAllCampaigns)
router.post("/", authenticate, checkEmptyString, createCampaign)
router.get("/company_campaigns/:id", authenticate, getCompanyCampaigns)
router.get("/campaign_channel_view_report/:id", authenticate, getCampaignChannelViewReport)
router.get("/campaign_creatives/:id", authenticate, getCampaignCreatives)

router.get("/conversion_bots", authenticate, getAllConversionBots)
router.get("/active_conversion_bots", authenticate, getActiveConversionBots)
router.post("/conversion_bots", authenticate, createConversionBot)
router.patch("/conversion_bots/:id", authenticate, updateConversionBot)


router.get("/campaign_conversion_bot/:id", authenticate, getCampaignConversionBot)
router.get("/campaign_conversion_creatives/:id", authenticate, getCampaignConversionCreatives)
router.get("/campaign_conversion_engagement/:id", authenticate, getCampaignConversionEngagements)
router.get("/campaign_posted_ads/:id", authenticate, getCampaignPostedAds)
router.post("/change_status/:id", authenticate, checkEmptyString, changeCampaignStatus)
router.get("/channels_approved_creative/:id", authenticate, getChannelsApprovedCreative)
router.get("/fetch_stat_and_delete_ads/:id", authenticate, checkEmptyString, fetchStatAndDeleteAd)

router.get("/compatible_channels/:id", authenticate, getAllCompatibleChannels)
router.get("/:id", authenticate, getCampaignDetail)



router.patch("/:id", authenticate, checkEmptyString, updateCampaign)

export default router
