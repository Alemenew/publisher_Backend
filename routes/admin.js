import express from "express";
import { createChannelCategory, getChannelCategories, updateChannelCategory, createChannelCategoryFromList } from "../controllers/admin/channelCategory.js";
import authenticate from "../middleware/authenticationMiddleware.js";
import { createDaySection, getDaySection, getDaySections } from "../controllers/admin/daySection.js";
import checkEmptyString from "../middleware/checkEmptyStringMiddleware.js";
import { createCampaignGoal, createCampaignGoalFromList, getCampaignGoals, updateCampaignGoal } from "../controllers/admin/campaignGoal.js";
import { PostAdsManually, postAdsAuto } from "../controllers/admin/postAds.js";
import { startActiveCampaignPostedAdStatFetch, startAllCrons, startCampaignStatusChange, startChannelSubscriberCountFetchCron, startCheckIfAdminRightFromChannelIsRevoked, startPostAd, startStagedPostCreativeStatusChange } from "../controllers/admin/cron_jobs/cron_job.js";
import { stagedPostCreativeStatusChangeCron } from "../controllers/admin/cron_jobs/cron_functions.js";
import { testRequestBody } from "../controllers/admin/test.js";
import { createIndividualBot, getAllIndividualBots, getAllProdIndividualBots, getAllTestIndividualBots, updateIndividualBot } from "../controllers/admin/individualBots.js";
import { createSupportedLanguage, getSupportedLanguage, getSupportedLanguages, updateSupportedLanguage } from "../controllers/admin/supportedLanguages.js";
import { addBotLanguage, getBotLanguages } from "../controllers/admin/botLanguage.js";
import { createPostCreativePaymentModes, getPostCreativePaymentModes, updatePostCreativePaymentModes } from "../controllers/admin/postCreativePaymentModes.js";
import { getUserData, saveUserData } from "../controllers/userData/userData.js";
import { getUserSelectedLanguage, saveUserSelectedLanguage } from "../controllers/admin/userSelectedLanguage.js";
import { createChannelTier, getAllChannelTier } from "../controllers/admin/channelTiers.js";

const router = express.Router()


router.get('/channel_categories', getChannelCategories)
router.post('/test_request_body', testRequestBody)
router.post('/channel_categories', authenticate, createChannelCategory)
router.patch('/channel_categories/:id', authenticate, updateChannelCategory)
router.post('/channel_categories/create_from_list', authenticate, createChannelCategoryFromList)

router.get('/day_sections', getDaySections)
router.post('/day_sections', authenticate, checkEmptyString, createDaySection)
router.get('/day_sections/:id', authenticate, getDaySection)

router.get('/campaign_goal', authenticate, getCampaignGoals)
router.post('/campaign_goal', authenticate, checkEmptyString, createCampaignGoal)
router.post('/campaign_goal/create_from_list', authenticate, checkEmptyString, createCampaignGoalFromList)
router.patch('/campaign_goal/:id', authenticate, checkEmptyString, updateCampaignGoal)

router.post('/post_ad_manually', authenticate, checkEmptyString, PostAdsManually)
router.get('/post_ads_auto', authenticate, checkEmptyString, postAdsAuto)

router.get('/start_campaign_status_change', authenticate, startCampaignStatusChange)
router.get('/start_staged_ad_status_change', authenticate, startStagedPostCreativeStatusChange)
router.get('/start_check_if_admin_right_from_channel_is_revoked', authenticate, startCheckIfAdminRightFromChannelIsRevoked)
router.get('/start_post_ad', authenticate, startPostAd)
router.get('/start_active_campaign_posted_ad_fetch_stat', authenticate, startActiveCampaignPostedAdStatFetch)
router.get('/start_channel_subscribers_count', authenticate, startChannelSubscriberCountFetchCron)
router.get('/start_all_crons', authenticate, startAllCrons)

router.get('/individual_bots', authenticate, getAllIndividualBots)
router.get('/test_individual_bots', authenticate, getAllTestIndividualBots)
router.get('/prod_individual_bots', authenticate, getAllProdIndividualBots)
router.post('/individual_bots', authenticate, checkEmptyString, createIndividualBot)
router.patch('/individual_bots/:id', authenticate, checkEmptyString, updateIndividualBot)


router.get('/supported_languages', authenticate, getSupportedLanguages)
router.post('/supported_languages', authenticate, checkEmptyString, createSupportedLanguage)
router.get('/supported_languages/:id', authenticate, getSupportedLanguage)
router.patch('/supported_languages/:id', authenticate, checkEmptyString, updateSupportedLanguage)


router.get('/bot_languages', authenticate, getBotLanguages)
router.post('/bot_languages', authenticate, checkEmptyString, addBotLanguage)

router.get('/post_creative_payment_mode', authenticate, getPostCreativePaymentModes)
router.post('/post_creative_payment_mode', authenticate, checkEmptyString, createPostCreativePaymentModes)
router.patch('/post_creative_payment_mode/:id', authenticate, checkEmptyString, updatePostCreativePaymentModes)

router.get('/user_data/:id', authenticate, getUserData)
router.post('/user_data/:id', authenticate, saveUserData)

router.get('/user_selected_language/:id', authenticate, getUserSelectedLanguage)
router.post('/user_selected_language/:id', authenticate, checkEmptyString, saveUserSelectedLanguage)


router.get('/channel_tier', authenticate, getAllChannelTier)
router.post('/channel_tier', authenticate, checkEmptyString, createChannelTier)



export default router
