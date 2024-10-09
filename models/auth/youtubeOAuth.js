// // /models/youtubeOAuth.js

// import mongoose from 'mongoose';

// const youtubeOAuthSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the user who authenticated
//   accessToken: { type: String, required: true },
//   refreshToken: { type: String, required: true },
//   scope: { type: String, required: true },
//   tokenType: { type: String, required: true },
//   expiryDate: { type: Date, required: true }
// }, { timestamps: true });

// const YouTubeOAuth = mongoose.model('YouTubeOAuth', youtubeOAuthSchema);

// export default YouTubeOAuth;


import YouTubeOAuth from '../models/youtubeOAuth.js';  // Import the model

// Route to handle the OAuth2 callback from Google
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  console.log("OAuth Callback - Received Code:", code);

  if (!code) {
    console.error('No code provided in OAuth2 callback');
    return res.status(400).json({ error: 'Invalid request: No code provided' });
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log("OAuth Callback - Full Tokens Received:", tokens);

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Failed to receive tokens from Google OAuth');
      return res.status(500).json({ error: 'Failed to receive access/refresh tokens' });
    }

    oauth2Client.setCredentials(tokens); // Set the tokens for future use

    // Save the token data to MongoDB
    const tokenData = new YouTubeOAuth({
      userId: req.user._id,  // Assuming you have user's ID stored in req.user._id
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: SCOPES.join(' '),  // Join the array of scopes into a single string
      tokenType: tokens.token_type,
      expiryDate: new Date(tokens.expiry_date)
    });

    await tokenData.save();  // Save the model to the database

    res.json({
      message: "Tokens received and saved successfully",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expiry_date,
    });
  } catch (err) {
    console.error('Error during OAuth token exchange or database operation:', err);
    res.status(500).json({ error: 'Token exchange failed or database error.' });
  }
});

