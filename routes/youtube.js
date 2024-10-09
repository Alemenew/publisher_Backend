import express from 'express';
import { listVideos } from '../controllers/youtubeController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to list user's videos
router.get('/videos', authMiddleware, listVideos);

export default router;

