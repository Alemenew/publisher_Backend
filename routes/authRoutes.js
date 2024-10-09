import express from 'express';
import { authorize, oauth2Callback } from '../controllers/auth/youtubeController.js';
import path from 'path';

const router = express.Router();

// Log the current file name
// console.log(`[${path.basename(__filename)}] Initializing authentication routes`);


// Route for Google OAuth authorization
router.get('/authorize', authorize);

// Route for Google OAuth callback
router.get('/oauth2callback', oauth2Callback);

export default router;

