// /middleware/authenticationMiddleware.js

import YouTubeOAuth from '../models/youtubeOAuth.js';

const authMiddleware = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : 'default-user-id'; // Replace with actual user logic
    const oauthEntry = await YouTubeOAuth.findOne({ userId });

    if (!oauthEntry || !oauthEntry.accessToken) {
      return res.status(401).send('Unauthorized: You need to authenticate with Google.');
    }

    req.oauthTokens = oauthEntry;  // Attach OAuth tokens to the request
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).send('Internal Server Error');
  }
};

export default authMiddleware;

