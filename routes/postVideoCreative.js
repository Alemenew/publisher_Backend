import express from "express";
import { createpostVideoCreative,getAllpostVideoCreative, getpostVideoCreativebyPlatform, getPrice } from '../controllers/postCreative/postVideoCreative.js';
const router = express.Router();

// Route to create a post video creative

router.post('/', createpostVideoCreative);
router.post('/get-price',getPrice);
router.get('/get-post-video-creative', getAllpostVideoCreative);
router.get('/get-post-video-creative-by-platform/:platform', getpostVideoCreativebyPlatform);

export default router;