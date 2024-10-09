import express from "express"
import { createPostCreative, getAllPostCreatives, getCampaignPostCreatives, getPostCreative, updatePostCreative } from "../controllers/postCreative/postCreative.js"
import authenticate from "../middleware/authenticationMiddleware.js"
import checkEmptyString from "../middleware/checkEmptyStringMiddleware.js"
import { approveStagedPostCreative, createStagedPostCreative, createStagedPostCreativeFromList, declineStagedPostCreative, getAllStagedPostCreatives, notifyChannel } from "../controllers/postCreative/stagedPostCreative.js"
import { createPostCreativePaymentValue, getAllPostCreativePaymentValues, getPostCreativePaymentValues, setDefaultPostCreativePaymentValue } from "../controllers/postCreative/postCreativePaymentValues.js"
import { createConversionCreative, getAllConversionCreatives, getConversionCreative, updateConversionCreative } from "../controllers/postCreative/conversionCreative.js"

const router = express.Router()

router.get("/", authenticate, getAllPostCreatives)
router.post("/", authenticate, checkEmptyString, createPostCreative)

router.get("/staged_post_creatives", authenticate, getAllStagedPostCreatives)
router.post("/staged_post_creatives", authenticate, checkEmptyString, createStagedPostCreative)
router.post("/staged_post_creatives/create_from_list", authenticate, createStagedPostCreativeFromList)
router.post("/staged_post_creatives/notify_channel", authenticate, checkEmptyString, notifyChannel)
router.patch("/staged_post_creatives/approve/:id", authenticate, approveStagedPostCreative)
router.patch("/staged_post_creatives/decline/:id", authenticate, declineStagedPostCreative)

router.get("/conversion_creative", authenticate, getAllConversionCreatives)
router.post("/conversion_creative", authenticate, checkEmptyString, createConversionCreative)

router.get("/campaign_post_creative/:id", authenticate, getCampaignPostCreatives)

router.get("/post_creative_payment_values", authenticate, getAllPostCreativePaymentValues)
router.post("/post_creative_payment_values", authenticate, checkEmptyString, createPostCreativePaymentValue)
router.get("/post_creative_payment_values/:id", authenticate, getPostCreativePaymentValues)
router.post("/set_default_post_creative_payment_values/:id", authenticate, setDefaultPostCreativePaymentValue)

router.patch("/conversion_creative/:id", authenticate, checkEmptyString, updateConversionCreative)
router.get("/conversion_creative/:id", authenticate, getConversionCreative)

router.get("/:id", authenticate, getPostCreative)
router.patch("/:id", authenticate, checkEmptyString, updatePostCreative)

export default router