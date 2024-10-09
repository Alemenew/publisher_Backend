import express from "express";
import authenticate from "../middleware/authenticationMiddleware.js";
import { createPostedAd, getChannelPostedAds, getPostedAdWithCreativeID, getPostedAs, updatePostedAd } from "../controllers/postedAds/postedAds.js";
import checkEmptyString from "../middleware/checkEmptyStringMiddleware.js";
import { createPostedAdEngagement, getAllEngagementCount, getPostedAdEngagementCount } from "../controllers/postedAds/engagementCount.js";
import { createPostedAdStat, getAllPostedAdStats, getPostedAdStats } from "../controllers/postedAds/postedAdStats.js";
import { addIndividualEarnings, getAllIndividualEarnings, getIndividualEarnings, updateIndividualEarnings } from "../controllers/postedAds/individualEarning.js";
import { createConversionEngagement, createConversionPost, getAllConversionEngagement } from "../controllers/postedAds/conversionEngagement.js";

const router = express.Router()


router.get('/', authenticate, getPostedAs)
router.post('/', authenticate, checkEmptyString, createPostedAd)

router.get('/conversion_engagement', authenticate, getAllConversionEngagement)
router.post('/conversion_engagement', authenticate, checkEmptyString, createConversionEngagement)
router.post('/create_conversion_post/:id', authenticate, checkEmptyString, createConversionPost)

router.patch('/:id', authenticate, updatePostedAd)

router.post('/get_posted_ad_with_creative_id', authenticate, checkEmptyString, getPostedAdWithCreativeID)
router.post('/get_channel_posted_ads', authenticate, checkEmptyString, getChannelPostedAds)

router.get('/engagement_count/posted_ad/:id', authenticate, getPostedAdEngagementCount)
router.post('/engagement_count/posted_ad/', authenticate, checkEmptyString, createPostedAdEngagement)
router.get('/engagement_count', authenticate, getAllEngagementCount)

router.get('/individual_earnings', authenticate, getAllIndividualEarnings)
router.post('/individual_earnings', authenticate, checkEmptyString, addIndividualEarnings)
router.get('/individual_earnings/:id', authenticate, getIndividualEarnings)
router.patch('/individual_earnings/:id', authenticate, checkEmptyString, updateIndividualEarnings)


router.get('/stats/posted_ad/:id', authenticate, getPostedAdStats)
router.post('/stats/posted_ad', authenticate, checkEmptyString, createPostedAdStat)
router.get('/stats', authenticate, getAllPostedAdStats)



export default router