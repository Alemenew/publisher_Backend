import express from "express";
import authenticate from "../middleware/authenticationMiddleware.js";
import { fetchChannelLastXPostStat, getAllStats, testGetAllStats, testGetMessages } from "../controllers/stat/stat.js";


const router = express.Router()

router.get('/get_all_stat', authenticate, getAllStats)
router.get('/fetch_channel_last_x_post_stat', authenticate, fetchChannelLastXPostStat)
router.get('/test_get_all_stat', authenticate, testGetAllStats)
router.get('/test_fetch_messages', authenticate, testGetMessages)

export default router